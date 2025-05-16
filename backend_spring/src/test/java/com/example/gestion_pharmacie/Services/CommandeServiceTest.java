package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.CommandeResponseDto;
import com.example.gestion_pharmacie.DTO.CreateCommandeRequest;
import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.Repositorys.CommandeRepository;
import com.example.gestion_pharmacie.Repositorys.FournisseurRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
public class CommandeServiceTest {

    @Mock
    private CommandeRepository commandeRepository;

    @Mock
    private FournisseurRepository fournisseurRepository;

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CommandeService commandeService;

    private Pharmacien pharmacien;
    private Fournisseur fournisseur;
    private Medicament medicament;
    private Commande commande;
    private LigneCommande ligneCommande;
    private CreateCommandeRequest createCommandeRequest;
    private LigneCommandeDto ligneCommandeDto;

    @BeforeEach
    void setUp() {
        // No need to mock SecurityContextHolder here, will use the UtilisateurService mocking

        // Create test data
        pharmacien = new Pharmacien();
        pharmacien.setId(1L);
        pharmacien.setNom("Nom Pharmacien");
        pharmacien.setPrenom("Prenom Pharmacien");
        pharmacien.setEmail("pharmacien@example.com");
        pharmacien.setRole(Role.PHARMACIEN);

        fournisseur = new Fournisseur();
        fournisseur.setId(2L);
        fournisseur.setNom("Nom Fournisseur");
        fournisseur.setPrenom("Prenom Fournisseur");
        fournisseur.setEmail("fournisseur@example.com");
        fournisseur.setRole(Role.FOURNISSEUR);

        medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Médicament Test");
        medicament.setPrix_hospitalier(100.0f);
        medicament.setPrix_public(150.0f);
        medicament.setQuantite(50);
        medicament.setUtilisateur(fournisseur);

        commande = new Commande();
        commande.setId(1L);
        commande.setDateCommande(LocalDateTime.now());
        commande.setStatut(StatutCommande.EN_COURS_DE_CREATION);
        commande.setPharmacien(pharmacien);
        commande.setFournisseur(fournisseur);

        ligneCommande = new LigneCommande();
        ligneCommande.setId(1L);
        ligneCommande.setQuantite(10);
        ligneCommande.setMedicament(medicament);
        ligneCommande.setCommande(commande);

        List<LigneCommande> lignesCommande = new ArrayList<>();
        lignesCommande.add(ligneCommande);
        commande.setLignesCommande(lignesCommande);

        // Request DTO
        ligneCommandeDto = new LigneCommandeDto();
        ligneCommandeDto.setMedicamentId(1L);
        ligneCommandeDto.setQuantite(10);

        List<LigneCommandeDto> ligneCommandeDtos = new ArrayList<>();
        ligneCommandeDtos.add(ligneCommandeDto);

        createCommandeRequest = new CreateCommandeRequest();
        createCommandeRequest.setFournisseurId(2L);
        createCommandeRequest.setLignesCommande(ligneCommandeDtos);
    }

    @Test
    void createCommande_Success() {
        // Arrange
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
        when(fournisseurRepository.findById(anyLong())).thenReturn(Optional.of(fournisseur));
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);
        when(commandeRepository.saveAndFlush(any(Commande.class))).thenReturn(commande);
        when(medicamentRepository.findById(anyLong())).thenReturn(Optional.of(medicament));

        // Act
        CommandeResponseDto result = commandeService.createCommande(createCommandeRequest);

        // Assert
        assertNotNull(result);
        assertEquals(commande.getId(), result.getId());
        assertEquals(commande.getStatut().toString(), result.getStatut());
        assertEquals(pharmacien.getId(), result.getPharmacien().getId());
        assertEquals(fournisseur.getId(), result.getFournisseur().getId());
        assertEquals(1, result.getLignesCommande().size());

        verify(commandeRepository, times(1)).save(any(Commande.class));
        verify(commandeRepository, times(1)).saveAndFlush(any(Commande.class));
    }

    @Test
    void createCommande_FournisseurNotFound() {
        // Arrange
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
        when(fournisseurRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            commandeService.createCommande(createCommandeRequest);
        });

        assertTrue(exception.getMessage().contains("Fournisseur non trouvé"));
        verify(commandeRepository, never()).save(any(Commande.class));
    }

    @Test
    void createCommande_MedicamentNotFound() {
        // Arrange
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
        when(fournisseurRepository.findById(anyLong())).thenReturn(Optional.of(fournisseur));
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);
        when(medicamentRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            commandeService.createCommande(createCommandeRequest);
        });

        assertTrue(exception.getMessage().contains("Médicament non trouvé"));
    }

    @Test
    void getCommandesForCurrentPharmacien_Success() {
        // Arrange
        List<Commande> commandes = new ArrayList<>();
        commandes.add(commande);
        
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
        when(commandeRepository.findByPharmacien(pharmacien)).thenReturn(commandes);

        // Act
        List<CommandeResponseDto> result = commandeService.getCommandesForCurrentPharmacien();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commande.getId(), result.get(0).getId());
        
        verify(commandeRepository, times(1)).findByPharmacien(pharmacien);
    }

    @Test
    void getCommandesForCurrentFournisseur_Success() {
        // Arrange
        List<Commande> commandes = new ArrayList<>();
        commandes.add(commande);
        
        when(utilisateurService.getCurrentFournisseur()).thenReturn(fournisseur);
        when(commandeRepository.findByFournisseur(fournisseur)).thenReturn(commandes);

        // Act
        List<CommandeResponseDto> result = commandeService.getCommandesForCurrentFournisseur();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commande.getId(), result.get(0).getId());
        
        verify(commandeRepository, times(1)).findByFournisseur(fournisseur);
    }

    @Test
    void getCommandeById_Success() {
        // Arrange
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.of(commande));
        when(utilisateurService.getCurrentUser()).thenReturn(pharmacien);

        // Act
        CommandeResponseDto result = commandeService.getCommandeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(commande.getId(), result.getId());
        
        verify(commandeRepository, times(1)).findById(1L);
    }

    @Test
    void getCommandeById_NotFound() {
        // Arrange
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            commandeService.getCommandeById(1L);
        });

        assertTrue(exception.getMessage().contains("Commande non trouvée"));
    }

    @Test
    void updateCommandeStatus_ToEnAttente_Success() {
        // Arrange
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.of(commande));
        when(utilisateurService.getCurrentPharmacien()).thenReturn(pharmacien);
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);

        // Act
        CommandeResponseDto result = commandeService.updateCommandeStatus(1L, StatutCommande.EN_ATTENTE);

        // Assert
        assertNotNull(result);
        assertEquals(StatutCommande.EN_ATTENTE.toString(), result.getStatut());
        
        verify(commandeRepository, times(1)).save(commande);
    }

    @Test
    void updateCommandeStatus_ToEnCoursDeLivraison_Success() {
        // Arrange
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.of(commande));
        when(utilisateurService.getCurrentFournisseur()).thenReturn(fournisseur);
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);

        // Act
        CommandeResponseDto result = commandeService.updateCommandeStatus(1L, StatutCommande.EN_COURS_DE_LIVRAISON);

        // Assert
        assertNotNull(result);
        assertEquals(StatutCommande.EN_COURS_DE_LIVRAISON.toString(), result.getStatut());
        
        verify(commandeRepository, times(1)).save(commande);
        verify(medicamentRepository, times(1)).save(medicament);
    }

    @Test
    void updateCommandeToLivree_Success() {
        // Arrange
        commande.setStatut(StatutCommande.EN_COURS_DE_LIVRAISON);
        
        List<Medicament> pharmacienMedicaments = new ArrayList<>();
        
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.of(commande));
        when(utilisateurService.getCurrentUser()).thenReturn(pharmacien);
        when(medicamentRepository.findByUtilisateur(pharmacien)).thenReturn(pharmacienMedicaments);
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);
        when(medicamentRepository.save(any(Medicament.class))).thenReturn(new Medicament());

        // Act
        CommandeResponseDto result = commandeService.updateCommandeToLivree(1L);

        // Assert
        assertNotNull(result);
        assertEquals(StatutCommande.LIVREE.toString(), result.getStatut());
        
        verify(commandeRepository, times(1)).save(commande);
        // Should save a new medicament for the pharmacist
        verify(medicamentRepository, times(1)).save(any(Medicament.class));
    }

    @Test
    void updateCommandeToLivree_IncorrectStatus() {
        // Arrange
        commande.setStatut(StatutCommande.EN_ATTENTE);
        
        when(commandeRepository.findById(anyLong())).thenReturn(Optional.of(commande));
        when(utilisateurService.getCurrentUser()).thenReturn(pharmacien);

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            commandeService.updateCommandeToLivree(1L);
        });

        assertTrue(exception.getMessage().contains("n'est pas en cours de livraison"));
        verify(commandeRepository, never()).save(any(Commande.class));
    }
}