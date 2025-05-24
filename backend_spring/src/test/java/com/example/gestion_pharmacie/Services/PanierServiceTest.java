package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.CreatePanierRequest;
import com.example.gestion_pharmacie.DTO.PanierResponseDto;
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

class PanierServiceTest {

    @Mock
    private PanierRepository panierRepository;

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @InjectMocks
    private PanierService panierService;

    private Pharmacien pharmacien;
    private Medicament medicament1;
    private Medicament medicament2;
    private Panier panier;
    private LignePanier lignePanier1;
    private LignePanier lignePanier2;
    private CreatePanierRequest createRequest;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test pharmacien
        pharmacien = new Pharmacien();
        pharmacien.setId(1L);
        pharmacien.setNom("Pharmacien Test");
        pharmacien.setEmail("pharmacien@example.com");

        // Create test medicaments
        medicament1 = new Medicament();
        medicament1.setId(1L);
        medicament1.setNom("Doliprane");
        medicament1.setQuantite(100);
        medicament1.setPrix_hospitalier(10);
        medicament1.setPrix_public(15);
        medicament1.setUtilisateur(pharmacien);

        medicament2 = new Medicament();
        medicament2.setId(2L);
        medicament2.setNom("Aspirine");
        medicament2.setQuantite(50);
        medicament2.setPrix_hospitalier(8);
        medicament2.setPrix_public(12);
        medicament2.setUtilisateur(pharmacien);

        // Create test panier
        panier = new Panier();
        panier.setId(1L);
        panier.setPharmacien(pharmacien);
        panier.setDateCreation(LocalDateTime.now());
        panier.setVendu(false);
        panier.setLignesPanier(new ArrayList<>());

        // Create test lignes panier
        lignePanier1 = new LignePanier();
        lignePanier1.setId(1L);
        lignePanier1.setQuantite(5);
        lignePanier1.setPanier(panier);
        lignePanier1.setMedicament(medicament1);

        lignePanier2 = new LignePanier();
        lignePanier2.setId(2L);
        lignePanier2.setQuantite(3);
        lignePanier2.setPanier(panier);
        lignePanier2.setMedicament(medicament2);

        // Add lignes to panier
        panier.getLignesPanier().add(lignePanier1);
        panier.getLignesPanier().add(lignePanier2);

        // Create test request
        createRequest = new CreatePanierRequest();
        List<CreatePanierRequest.PanierItemDto> items = new ArrayList<>();
        
        CreatePanierRequest.PanierItemDto item1 = new CreatePanierRequest.PanierItemDto();
        item1.setMedicamentId(1L);
        item1.setQuantite(5);
        items.add(item1);
        
        CreatePanierRequest.PanierItemDto item2 = new CreatePanierRequest.PanierItemDto();
        item2.setMedicamentId(2L);
        item2.setQuantite(3);
        items.add(item2);
        
        createRequest.setItems(items);

        // Mock the current user as pharmacien
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
    }

    @Test
    void createAndSubmitPanier_Success() {
        // Arrange
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.of(medicament2));
        when(panierRepository.save(any(Panier.class))).thenReturn(panier);
        
        // Act
        PanierResponseDto result = panierService.createAndSubmitPanier(createRequest);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(2, result.getLignesPanier().size());
        
        verify(medicamentRepository, times(1)).save(medicament1);
        verify(medicamentRepository, times(1)).save(medicament2);
        verify(panierRepository, times(1)).save(any(Panier.class));
        
        // Verify medicament quantities were decreased
        assertEquals(95, medicament1.getQuantite());
        assertEquals(47, medicament2.getQuantite());
    }

    @Test
    void createAndSubmitPanier_MedicamentNotFound() {
        // Arrange
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            panierService.createAndSubmitPanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("Médicament non trouvé"));
    }

    @Test
    void createAndSubmitPanier_MedicamentNotOwnedByPharmacien() {
        // Arrange
        Pharmacien otherPharmacien = new Pharmacien();
        otherPharmacien.setId(2L);
        medicament2.setUtilisateur(otherPharmacien);
        
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.of(medicament2));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            panierService.createAndSubmitPanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("ne vous appartient pas"));
    }

    @Test
    void createAndSubmitPanier_InsufficientQuantity() {
        // Arrange
        medicament2.setQuantite(2); // Less than requested 3
        
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.of(medicament2));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            panierService.createAndSubmitPanier(createRequest);
        });
        
        assertTrue(exception.getMessage().contains("Quantité insuffisante pour Aspirine"));
    }

    @Test
    void getPaniersForCurrentPharmacien_Success() {
        // Arrange
        List<Panier> paniers = Arrays.asList(panier);
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(paniers);
        
        // Act
        List<PanierResponseDto> result = panierService.getPaniersForCurrentPharmacien();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(2, result.get(0).getLignesPanier().size());
    }

    @Test
    void closeCurrentPanier_Success() {
        // Arrange
        List<Panier> paniers = Arrays.asList(panier);
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(paniers);
        when(panierRepository.save(panier)).thenReturn(panier);
        
        // Act
        PanierResponseDto result = panierService.closeCurrentPanier();
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(panierRepository, times(1)).save(panier);
        assertTrue(panier.isVendu());
    }

    @Test
    void closeCurrentPanier_NoPanierFound() {
        // Arrange
        List<Panier> emptyList = new ArrayList<>();
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(emptyList);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            panierService.closeCurrentPanier();
        });
        
        assertTrue(exception.getMessage().contains("Aucun panier ouvert"));
    }

    @Test
    void closeCurrentPanier_OnlyClosedPaniers() {
        // Arrange
        panier.setVendu(true);
        List<Panier> closedPaniers = Arrays.asList(panier);
        when(panierRepository.findByPharmacien(pharmacien)).thenReturn(closedPaniers);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            panierService.closeCurrentPanier();
        });
        
        assertTrue(exception.getMessage().contains("Aucun panier ouvert"));
    }
} 