package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.LignePanierCreateRequest;
import com.example.gestion_pharmacie.DTO.LignePanierResponseDto;
import com.example.gestion_pharmacie.DTO.LignePanierUpdateRequest;
import com.example.gestion_pharmacie.Repositorys.LignePanierRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Repositorys.PanierRepository;
import com.example.gestion_pharmacie.entites.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LignePanierServiceTest {

    @Mock
    private LignePanierRepository lignePanierRepository;

    @Mock
    private PanierRepository panierRepository;

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @InjectMocks
    private LignePanierService lignePanierService;

    private Pharmacien pharmacien;
    private Medicament medicament;
    private Panier panier;
    private LignePanier lignePanier;
    private LignePanierCreateRequest createRequest;
    private LignePanierUpdateRequest updateRequest;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test pharmacien
        pharmacien = new Pharmacien();
        pharmacien.setId(1L);
        pharmacien.setNom("Pharmacien Test");
        pharmacien.setEmail("pharmacien@example.com");

        // Create test medicament
        medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Doliprane");
        medicament.setQuantite(100);
        medicament.setPrix_hospitalier(10);
        medicament.setPrix_public(15);
        medicament.setUtilisateur(pharmacien);

        // Create test panier
        panier = new Panier();
        panier.setId(1L);
        panier.setPharmacien(pharmacien);
        panier.setDateCreation(LocalDateTime.now());
        panier.setVendu(false);
        panier.setLignesPanier(new ArrayList<>());

        // Create test ligne panier
        lignePanier = new LignePanier();
        lignePanier.setId(1L);
        lignePanier.setQuantite(5);
        lignePanier.setPanier(panier);
        lignePanier.setMedicament(medicament);

        // Create test request objects
        createRequest = new LignePanierCreateRequest();
        createRequest.setMedicamentId(1L);
        createRequest.setQuantite(5);

        updateRequest = new LignePanierUpdateRequest();
        updateRequest.setQuantite(10);

        // Mock current user
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
    }

    @Test
    void addLignePanier_Success_WithExistingPanier() {
        // Arrange
        List<Panier> existingPaniers = Arrays.asList(panier);
        
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(existingPaniers);
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        when(lignePanierRepository.save(any(LignePanier.class))).thenReturn(lignePanier);
        
        // Act
        LignePanierResponseDto result = lignePanierService.addLignePanier(createRequest);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(5, result.getQuantite());
        assertEquals(1L, result.getMedicament().getId());
        assertEquals("Doliprane", result.getMedicament().getNom());
        verify(medicamentRepository, times(1)).save(medicament);
        verify(lignePanierRepository, times(1)).save(any(LignePanier.class));
        // Verify the medicament quantity was decreased
        assertEquals(95, medicament.getQuantite());
    }

    @Test
    void addLignePanier_Success_WithNewPanier() {
        // Arrange
        List<Panier> emptyPanierList = new ArrayList<>();
        
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(emptyPanierList);
        when(panierRepository.save(any(Panier.class))).thenReturn(panier);
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        when(lignePanierRepository.save(any(LignePanier.class))).thenReturn(lignePanier);
        
        // Act
        LignePanierResponseDto result = lignePanierService.addLignePanier(createRequest);
        
        // Assert
        assertNotNull(result);
        verify(panierRepository, times(1)).save(any(Panier.class));
        verify(medicamentRepository, times(1)).save(medicament);
        verify(lignePanierRepository, times(1)).save(any(LignePanier.class));
    }

    @Test
    void addLignePanier_MedicamentNotFound() {
        // Arrange
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(Arrays.asList(panier));
        when(medicamentRepository.findById(99L)).thenReturn(Optional.empty());
        
        createRequest.setMedicamentId(99L);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.addLignePanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("Médicament non trouvé"));
    }

    @Test
    void addLignePanier_MedicamentNotBelongingToUser() {
        // Arrange
        Pharmacien otherPharmacien = new Pharmacien();
        otherPharmacien.setId(2L);
        medicament.setUtilisateur(otherPharmacien);
        
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(Arrays.asList(panier));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.addLignePanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("ne vous appartient pas"));
    }

    @Test
    void addLignePanier_InsufficientQuantity() {
        // Arrange
        medicament.setQuantite(3); // Less than requested 5
        
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(Arrays.asList(panier));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.addLignePanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("Quantité insuffisante"));
    }

    @Test
    void getLignesPanierForCurrentUser_Success() {
        // Arrange
        List<LignePanier> lignesPanier = Arrays.asList(lignePanier);
        
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(Arrays.asList(panier));
        when(lignePanierRepository.findByPanier(panier)).thenReturn(lignesPanier);
        
        // Act
        List<LignePanierResponseDto> result = lignePanierService.getLignesPanierForCurrentUser();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(5, result.get(0).getQuantite());
        assertEquals("Doliprane", result.get(0).getMedicament().getNom());
    }

    @Test
    void updateLignePanier_Success_IncreaseQuantity() {
        // Arrange
        when(lignePanierRepository.findById(1L)).thenReturn(Optional.of(lignePanier));
        when(lignePanierRepository.save(any(LignePanier.class))).thenReturn(lignePanier);
        
        // Use a quantity higher than current (5 -> 10)
        updateRequest.setQuantite(10);
        
        // Act
        LignePanierResponseDto result = lignePanierService.updateLignePanier(1L, updateRequest);
        
        // Assert
        assertNotNull(result);
        assertEquals(10, result.getQuantite());
        verify(medicamentRepository, times(1)).save(medicament);
        verify(lignePanierRepository, times(1)).save(lignePanier);
        // Verify medicament quantity was decreased by the difference (5)
        assertEquals(95, medicament.getQuantite());
    }

    @Test
    void updateLignePanier_Success_DecreaseQuantity() {
        // Arrange
        when(lignePanierRepository.findById(1L)).thenReturn(Optional.of(lignePanier));
        when(lignePanierRepository.save(any(LignePanier.class))).thenReturn(lignePanier);
        
        // Use a quantity lower than current (5 -> 3)
        updateRequest.setQuantite(3);
        
        // Act
        LignePanierResponseDto result = lignePanierService.updateLignePanier(1L, updateRequest);
        
        // Assert
        assertNotNull(result);
        assertEquals(3, result.getQuantite());
        verify(medicamentRepository, times(1)).save(medicament);
        verify(lignePanierRepository, times(1)).save(lignePanier);
        // Verify medicament quantity was increased by the difference (2)
        assertEquals(102, medicament.getQuantite());
    }

    @Test
    void updateLignePanier_NotFound() {
        // Arrange
        when(lignePanierRepository.findById(99L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.updateLignePanier(99L, updateRequest);
        });
        
        assertTrue(exception.getMessage().contains("LignePanier non trouvée"));
    }

    @Test
    void updateLignePanier_InsufficientQuantity() {
        // Arrange
        when(lignePanierRepository.findById(1L)).thenReturn(Optional.of(lignePanier));
        medicament.setQuantite(3); // Not enough to increase from 5 to 10
        updateRequest.setQuantite(10);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.updateLignePanier(1L, updateRequest);
        });
        
        assertTrue(exception.getMessage().contains("Quantité insuffisante"));
    }

    @Test
    void deleteLignePanier_Success() {
        // Arrange
        when(lignePanierRepository.findById(1L)).thenReturn(Optional.of(lignePanier));
        
        // Act
        lignePanierService.deleteLignePanier(1L);
        
        // Assert
        verify(medicamentRepository, times(1)).save(medicament);
        verify(lignePanierRepository, times(1)).delete(lignePanier);
        // Verify medicament quantity was increased by the ligne's quantity
        assertEquals(105, medicament.getQuantite());
    }

    @Test
    void deleteLignePanier_NotFound() {
        // Arrange
        when(lignePanierRepository.findById(99L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            lignePanierService.deleteLignePanier(99L);
        });
        
        assertTrue(exception.getMessage().contains("LignePanier non trouvée"));
    }
} 