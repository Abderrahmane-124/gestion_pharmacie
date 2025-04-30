package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.AlerteRequest;
import com.example.gestion_pharmacie.Services.AlerteService;
import com.example.gestion_pharmacie.entites.Alerte;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertes")
public class AlerteController {

    private final AlerteService alerteService;

    public AlerteController(AlerteService alerteService) {
        this.alerteService = alerteService;
    }

    @PostMapping
    public ResponseEntity<Alerte> creerAlerte(@RequestBody AlerteRequest request) {
        return new ResponseEntity<>(
                alerteService.creerAlerte(
                        request.getMessage(),
                        request.getMinimumQuantite(),
                        request.getMedicamentIds()
                ),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{alerteId}")
    public ResponseEntity<Alerte> modifierAlerte(@PathVariable Long alerteId, @RequestBody AlerteRequest request) {
        return ResponseEntity.ok(
                alerteService.modifierAlerte(
                        alerteId,
                        request.getMessage(),
                        request.getMinimumQuantite(),
                        request.getMedicamentIds()
                )
        );
    }

    @DeleteMapping("/{alerteId}")
    public ResponseEntity<Map<String, String>> supprimerAlerte(@PathVariable Long alerteId) {
        alerteService.supprimerAlerte(alerteId);
        return ResponseEntity.ok(Map.of("message", "Alerte supprimée avec succès"));
    }

    @GetMapping
    public ResponseEntity<List<Alerte>> getAlertesUtilisateur() {
        return ResponseEntity.ok(alerteService.getAlertesUtilisateur());
    }

}