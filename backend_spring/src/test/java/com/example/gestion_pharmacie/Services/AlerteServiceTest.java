package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.AlerteRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.Alerte;
import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class AlerteServiceTest {

    @Mock
    private AlerteRepository alerteRepository;

    @Mock
    private MedicamentRepository medicamentRepository;

    @Mock
    private UtilisateurService utilisateurService;

    @InjectMocks
    private AlerteService alerteService;

    private Utilisateur utilisateur;
    private Medicament medicament1;
    private Medicament medicament2;
    private Alerte alerte;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test data
        utilisateur = new Utilisateur();
        utilisateur.setId(1L);
        utilisateur.setNom("Test User");
        utilisateur.setEmail("test@example.com");

        medicament1 = new Medicament();
        medicament1.setId(1L);
        medicament1.setNom("Medicament 1");
        medicament1.setUtilisateur(utilisateur);

        medicament2 = new Medicament();
        medicament2.setId(2L);
        medicament2.setNom("Medicament 2");
        medicament2.setUtilisateur(utilisateur);

        alerte = new Alerte();
        alerte.setId(1L);
        alerte.setMessage("Test Alert");
        alerte.setMinimumQuantite(5);
        alerte.setDateCreation(LocalDateTime.now());
        alerte.setUtilisateur(utilisateur);
        alerte.setMedicaments(Arrays.asList(medicament1, medicament2));

        // Mock current user
        when(utilisateurService.getCurrentUser()).thenReturn(utilisateur);
    }

    @Test
    void creerAlerte_Success() {
        // Arrange
        List<Long> medicamentIds = Arrays.asList(1L, 2L);
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.of(medicament2));
        when(alerteRepository.save(any(Alerte.class))).thenReturn(alerte);

        // Act
        Alerte result = alerteService.creerAlerte("Test Alert", 5, medicamentIds);

        // Assert
        assertNotNull(result);
        assertEquals("Test Alert", result.getMessage());
        assertEquals(5, result.getMinimumQuantite());
        assertEquals(2, result.getMedicaments().size());
        verify(alerteRepository, times(1)).save(any(Alerte.class));
    }

    @Test
    void creerAlerte_MedicamentNotFound() {
        // Arrange
        List<Long> medicamentIds = Arrays.asList(1L, 99L);
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            alerteService.creerAlerte("Test Alert", 5, medicamentIds);
        });

        assertTrue(exception.getMessage().contains("Médicament non trouvé"));
    }

    @Test
    void creerAlerte_NotOwnedMedicament() {
        // Arrange
        Utilisateur otherUser = new Utilisateur();
        otherUser.setId(2L);
        
        Medicament notOwnedMedicament = new Medicament();
        notOwnedMedicament.setId(3L);
        notOwnedMedicament.setUtilisateur(otherUser);
        
        List<Long> medicamentIds = Arrays.asList(1L, 3L);
        
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(3L)).thenReturn(Optional.of(notOwnedMedicament));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            alerteService.creerAlerte("Test Alert", 5, medicamentIds);
        });

        assertTrue(exception.getMessage().contains("ne pouvez ajouter que vos propres médicaments"));
    }

    @Test
    void modifierAlerte_Success() {
        // Arrange
        List<Long> medicamentIds = Arrays.asList(1L, 2L);
        when(alerteRepository.findById(1L)).thenReturn(Optional.of(alerte));
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament1));
        when(medicamentRepository.findById(2L)).thenReturn(Optional.of(medicament2));
        when(alerteRepository.save(any(Alerte.class))).thenReturn(alerte);

        // Act
        Alerte result = alerteService.modifierAlerte(1L, "Updated Alert", 10, medicamentIds);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Alert", result.getMessage());
        assertEquals(10, result.getMinimumQuantite());
        verify(alerteRepository, times(1)).save(any(Alerte.class));
    }

    @Test
    void modifierAlerte_AlerteNotFound() {
        // Arrange
        when(alerteRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            alerteService.modifierAlerte(99L, "Updated Alert", 10, Arrays.asList(1L));
        });

        assertTrue(exception.getMessage().contains("Alerte non trouvée"));
    }

    @Test
    void modifierAlerte_NotOwner() {
        // Arrange
        Utilisateur otherUser = new Utilisateur();
        otherUser.setId(2L);
        
        Alerte notOwnedAlerte = new Alerte();
        notOwnedAlerte.setId(2L);
        notOwnedAlerte.setUtilisateur(otherUser);
        
        when(alerteRepository.findById(2L)).thenReturn(Optional.of(notOwnedAlerte));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            alerteService.modifierAlerte(2L, "Updated Alert", 10, Arrays.asList(1L));
        });

        assertTrue(exception.getMessage().contains("n'êtes pas autorisé"));
    }

    @Test
    void supprimerAlerte_Success() {
        // Arrange
        when(alerteRepository.findById(1L)).thenReturn(Optional.of(alerte));

        // Act
        alerteService.supprimerAlerte(1L);

        // Assert
        verify(alerteRepository, times(1)).delete(alerte);
    }

    @Test
    void supprimerAlerte_AlerteNotFound() {
        // Arrange
        when(alerteRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            alerteService.supprimerAlerte(99L);
        });

        assertTrue(exception.getMessage().contains("Alerte non trouvée"));
    }

    @Test
    void getAlertesUtilisateur_Success() {
        // Arrange
        List<Alerte> alertes = Arrays.asList(alerte);
        when(alerteRepository.findByUtilisateurId(1L)).thenReturn(alertes);

        // Act
        List<Alerte> result = alerteService.getAlertesUtilisateur();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(alerte.getId(), result.get(0).getId());
    }
} 