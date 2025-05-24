package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.AlerteRequest;
import com.example.gestion_pharmacie.Services.AlerteService;
import com.example.gestion_pharmacie.entites.Alerte;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AlerteControllerTest {

    @Mock
    AlerteService alerteService;

    @InjectMocks
    AlerteController alerteController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreerAlerte() {
        Alerte expectedAlerte = new Alerte();
        when(alerteService.creerAlerte(anyString(), anyInt(), anyList()))
                .thenReturn(expectedAlerte);

        AlerteRequest request = new AlerteRequest();
        request.setMessage("Test message");
        request.setMinimumQuantite(5);
        request.setMedicamentIds(List.of(1L, 2L));

        ResponseEntity<Alerte> result = alerteController.creerAlerte(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertEquals(expectedAlerte, result.getBody());
    }

    @Test
    void testModifierAlerte() {
        Alerte expectedAlerte = new Alerte();
        when(alerteService.modifierAlerte(anyLong(), anyString(), anyInt(), anyList()))
                .thenReturn(expectedAlerte);

        AlerteRequest request = new AlerteRequest();
        request.setMessage("Updated");
        request.setMinimumQuantite(10);
        request.setMedicamentIds(List.of(3L));

        ResponseEntity<Alerte> result = alerteController.modifierAlerte(1L, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(expectedAlerte, result.getBody());
    }

    @Test
    void testSupprimerAlerte() {
        // Pas besoin de when() car supprimerAlerte() retourne void
        Long alerteId = 1L;

        ResponseEntity<Map<String, String>> result = alerteController.supprimerAlerte(alerteId);

        verify(alerteService).supprimerAlerte(alerteId);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(Map.of("message", "Alerte supprimée avec succès"), result.getBody());
    }

    @Test
    void testGetAlertesUtilisateur() {
        List<Alerte> alertes = List.of(new Alerte());
        when(alerteService.getAlertesUtilisateur()).thenReturn(alertes);

        ResponseEntity<List<Alerte>> result = alerteController.getAlertesUtilisateur();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(alertes, result.getBody());
    }
}
