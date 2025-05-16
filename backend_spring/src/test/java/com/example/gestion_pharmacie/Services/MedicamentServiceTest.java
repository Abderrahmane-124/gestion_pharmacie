package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.FournisseurRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Repositorys.UtilisateurRepository;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MedicamentServiceTest {

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private FournisseurRepository fournisseurRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private ExcelLoaderService excelLoaderService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private MedicamentService medicamentService;

    private Pharmacien pharmacien;
    private Fournisseur fournisseur;
    private Medicament medicament;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Mock the security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.getName()).thenReturn("user@example.com");

        // Create test users
        pharmacien = new Pharmacien();
        pharmacien.setId(1L);
        pharmacien.setNom("Pharmacien Test");
        pharmacien.setEmail("user@example.com");
        pharmacien.setRole(Role.PHARMACIEN);

        fournisseur = new Fournisseur();
        fournisseur.setId(2L);
        fournisseur.setNom("Fournisseur Test");
        fournisseur.setEmail("fournisseur@example.com");
        fournisseur.setRole(Role.FOURNISSEUR);

        // Create test medicament
        medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Doliprane");
        medicament.setQuantite(100);
        medicament.setPrix_hospitalier(10);
        medicament.setPrix_public(15);
        medicament.setUtilisateur(pharmacien);
    }

    @Test
    void saveMedicament_Success() {
        // Arrange
        Medicament newMedicament = new Medicament();
        newMedicament.setNom("Advil");
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.save(any(Medicament.class))).thenAnswer(invocation -> {
            Medicament med = invocation.getArgument(0);
            med.setId(2L);
            return med;
        });
        
        // Act
        Medicament result = medicamentService.saveMedicament(newMedicament);
        
        // Assert
        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Advil", result.getNom());
        assertEquals(pharmacien, result.getUtilisateur());
        verify(medicamentRepository, times(1)).save(newMedicament);
    }

    @Test
    void saveMedicament_UserNotFound() {
        // Arrange
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.saveMedicament(new Medicament());
        });
        
        assertTrue(exception.getMessage().contains("Utilisateur non trouvé"));
    }

    @Test
    void updateMedicament_Success() {
        // Arrange
        Medicament updateData = new Medicament();
        updateData.setNom("Doliprane Forte");
        updateData.setQuantite(150);
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        when(medicamentRepository.save(any(Medicament.class))).thenReturn(medicament);
        
        // Act
        Medicament result = medicamentService.updateMedicament(1L, updateData);
        
        // Assert
        assertNotNull(result);
        assertEquals("Doliprane Forte", result.getNom());
        assertEquals(150, result.getQuantite());
    }

    @Test
    void updateMedicament_NotTheOwner() {
        // Arrange
        Pharmacien otherPharmacien = new Pharmacien();
        otherPharmacien.setId(3L);
        medicament.setUtilisateur(otherPharmacien);
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.updateMedicament(1L, new Medicament());
        });
        
        assertTrue(exception.getMessage().contains("n'êtes pas autorisé"));
    }

    @Test
    void updateMedicament_MedicamentNotFound() {
        // Arrange
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findById(99L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.updateMedicament(99L, new Medicament());
        });
        
        assertTrue(exception.getMessage().contains("Medicament not found"));
    }

    @Test
    void deleteMedicament_Success() {
        // Arrange
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act
        medicamentService.deleteMedicament(1L);
        
        // Assert
        verify(medicamentRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteMedicament_NotTheOwner() {
        // Arrange
        Pharmacien otherPharmacien = new Pharmacien();
        otherPharmacien.setId(3L);
        medicament.setUtilisateur(otherPharmacien);
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.deleteMedicament(1L);
        });
        
        assertTrue(exception.getMessage().contains("n'êtes pas autorisé"));
    }

    @Test
    void getUserMedicaments_Success() {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(medicament);
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findByUtilisateurId(1L)).thenReturn(medicaments);
        
        // Act
        List<Medicament> result = medicamentService.getUserMedicaments();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getAllMedicaments_Success() {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(medicament);
        when(medicamentRepository.findAll()).thenReturn(medicaments);
        
        // Act
        List<Medicament> result = medicamentService.getAllMedicaments();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void searchMedicaments_Success() {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(medicament);
        when(medicamentRepository.findByNomContainingIgnoreCase("doli")).thenReturn(medicaments);
        
        // Act
        List<Medicament> result = medicamentService.searchMedicaments("doli");
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Doliprane", result.get(0).getNom());
    }

    @Test
    void toggleEnVente_Success() {
        // Arrange
        // Change the current user to a fournisseur
        when(authentication.getName()).thenReturn("fournisseur@example.com");
        when(utilisateurRepository.findByEmail("fournisseur@example.com")).thenReturn(Optional.of(fournisseur));
        
        medicament.setUtilisateur(fournisseur);
        medicament.setEn_vente(false);
        
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));
        when(medicamentRepository.save(medicament)).thenReturn(medicament);
        
        // Act
        Medicament result = medicamentService.toggleEnVente(1L, true);
        
        // Assert
        assertNotNull(result);
        assertTrue(result.isEn_vente());
        verify(medicamentRepository, times(1)).save(medicament);
    }

    @Test
    void toggleEnVente_NotFournisseur() {
        // Arrange - pharmacien is not a fournisseur
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(pharmacien));
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.toggleEnVente(1L, true);
        });
        
        assertTrue(exception.getMessage().contains("Seuls les fournisseurs"));
    }

    @Test
    void getMedicamentsEnVente_Success() {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(medicament);
        when(medicamentRepository.findMedicamentsEnVente()).thenReturn(medicaments);
        
        // Act
        List<Medicament> result = medicamentService.getMedicamentsEnVente();
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMedicamentsByFournisseur_Success() {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(medicament);
        
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(pharmacien));
        when(medicamentRepository.findByUtilisateur(pharmacien)).thenReturn(medicaments);
        
        // Act
        List<Medicament> result = medicamentService.getMedicamentsByFournisseur(1L);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getMedicamentsByFournisseur_FournisseurNotFound() {
        // Arrange
        when(utilisateurRepository.findById(99L)).thenReturn(Optional.empty());
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicamentService.getMedicamentsByFournisseur(99L);
        });
        
        assertTrue(exception.getMessage().contains("Fournisseur non trouvé"));
    }
} 