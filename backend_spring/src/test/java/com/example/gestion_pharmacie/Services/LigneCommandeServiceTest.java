package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.Repositorys.CommandeRepository;
import com.example.gestion_pharmacie.Repositorys.LigneCommandeRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LigneCommandeServiceTest {

    @Mock
    private LigneCommandeRepository ligneCommandeRepository;

    @Mock
    private CommandeRepository commandeRepository;

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @InjectMocks
    private LigneCommandeService ligneCommandeService;

    private Pharmacien pharmacien;
    private Fournisseur fournisseur;
    private Medicament medicament;
    private Commande commande;
    private LigneCommande ligneCommande;
    private LigneCommandeDto ligneCommandeDto;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test users
        pharmacien = new Pharmacien();
        pharmacien.setId(1L);
        pharmacien.setNom("Pharmacien Test");
        pharmacien.setEmail("pharmacien@example.com");

        fournisseur = new Fournisseur();
        fournisseur.setId(2L);
        fournisseur.setNom("Fournisseur Test");
        fournisseur.setEmail("fournisseur@example.com");

        // Create test medicament
        medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Doliprane");
        medicament.setQuantite(100);
        medicament.setUtilisateur(fournisseur);

        // Create test commande
        commande = new Commande();
        commande.setId(1L);
        commande.setStatut(StatutCommande.EN_COURS_DE_CREATION);
        commande.setPharmacien(pharmacien);
        commande.setFournisseur(fournisseur);
        commande.setLignesCommande(new ArrayList<>());

        // Create test ligne commande
        ligneCommande = new LigneCommande();
        ligneCommande.setId(1L);
        ligneCommande.setQuantite(10);
        ligneCommande.setCommande(commande);
        ligneCommande.setMedicament(medicament);

        // Create test DTO
        ligneCommandeDto = new LigneCommandeDto();
        ligneCommandeDto.setMedicamentId(1L);
        ligneCommandeDto.setQuantite(10);

        // Mock the current user as pharmacien
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
    }

    @Test
    void createLigneCommande_Success() {
        // Arrange
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        when(ligneCommandeRepository.save(any(LigneCommande.class))).thenReturn(ligneCommande);
        
        // Act
        LigneCommande result = ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        
        // Assert
        assertNotNull(result);
        assertEquals(10, result.getQuantite());
        assertEquals(medicament.getId(), result.getMedicament().getId());
        verify(ligneCommandeRepository, times(1)).save(any(LigneCommande.class));
        verify(commandeRepository, times(1)).save(commande);
    }

    @Test
    void createLigneCommande_CommandeNotFound() {
        // Arrange
        when(commandeRepository.findById(99L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(99L, ligneCommandeDto);
        });
        
        assertTrue(exception.getMessage().contains("Commande non trouvée"));
    }

    @Test
    void createLigneCommande_CommandeNotInCreationStatus() {
        // Arrange
        commande.setStatut(StatutCommande.EN_COURS_DE_CREATION);
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        });
        
        assertFalse(exception.getMessage().contains("Impossible de modifier"));
    }

    @Test
    void createLigneCommande_NotCommandeOwner() {
        // Arrange
        Pharmacien otherPharmacien = new Pharmacien();
        otherPharmacien.setId(3L);
        commande.setPharmacien(otherPharmacien);
        
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        });
        
        assertTrue(exception.getMessage().contains("n'êtes pas autorisé"));
    }

    @Test
    void createLigneCommande_MedicamentNotFound() {
        // Arrange
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        when(medicamentRepository.findById(99L)).thenReturn(Optional.empty());
        
        ligneCommandeDto.setMedicamentId(99L);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        });
        
        assertTrue(exception.getMessage().contains("Médicament non trouvé"));
    }

    @Test
    void createLigneCommande_MedicamentNotFromFournisseur() {
        // Arrange
        Fournisseur otherFournisseur = new Fournisseur();
        otherFournisseur.setId(3L);
        medicament.setUtilisateur(otherFournisseur);
        
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        });
        
        assertTrue(exception.getMessage().contains("n'est pas fourni par ce fournisseur"));
    }

    @Test
    void createLigneCommande_InsufficientQuantity() {
        // Arrange
        medicament.setQuantite(5); // Set quantity lower than requested
        
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            ligneCommandeService.createLigneCommande(1L, ligneCommandeDto);
        });
        
        assertTrue(exception.getMessage().contains("Stock insuffisant"));
    }

    @Test
    void updateLigneCommande_Success() {
        // Arrange
        commande.setStatut(StatutCommande.EN_ATTENTE);
        ligneCommandeDto.setQuantite(15); // Update quantity
        
        when(ligneCommandeRepository.findById(1L)).thenReturn(Optional.of(ligneCommande));
        when(ligneCommandeRepository.save(any(LigneCommande.class))).thenReturn(ligneCommande);
        
        // Act
        LigneCommande result = ligneCommandeService.updateLigneCommande(1L, ligneCommandeDto);
        
        // Assert
        assertNotNull(result);
        assertEquals(15, result.getQuantite());
        verify(ligneCommandeRepository, times(1)).save(ligneCommande);
    }

    @Test
    void deleteLigneCommande_Success() {
        // Arrange
        commande.setStatut(StatutCommande.EN_ATTENTE);
        when(ligneCommandeRepository.findById(1L)).thenReturn(Optional.of(ligneCommande));
        
        // Act
        ligneCommandeService.deleteLigneCommande(1L);
        
        // Assert
        verify(ligneCommandeRepository, times(1)).delete(ligneCommande);
    }

    @Test
    void getLignesCommandeByCommande_Success() {
        // Arrange
        List<LigneCommande> lignesCommande = Arrays.asList(ligneCommande);
        
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));
        when(ligneCommandeRepository.findByCommande(commande)).thenReturn(lignesCommande);
        
        // Act
        List<LigneCommande> result = ligneCommandeService.getLignesCommandeByCommande(1L);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(ligneCommande.getId(), result.get(0).getId());
    }

    @Test
    void getAllLigneCommandes_Success() {
        // Arrange
        List<LigneCommande> lignesCommande = Arrays.asList(ligneCommande);
        when(ligneCommandeRepository.findAll()).thenReturn(lignesCommande);
        
        // Act
        List<LigneCommande> result = ligneCommandeService.getAllLigneCommandes();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(ligneCommande.getId(), result.get(0).getId());
    }
} 