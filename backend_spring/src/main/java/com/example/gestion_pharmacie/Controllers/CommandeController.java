package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.CommandeResponseDto;
import com.example.gestion_pharmacie.DTO.CreateCommandeRequest;
import com.example.gestion_pharmacie.Services.CommandeService;
import com.example.gestion_pharmacie.entites.StatutCommande;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/commandes")
public class CommandeController {
    private final CommandeService commandeService;

    public CommandeController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PostMapping
    public ResponseEntity<CommandeResponseDto> createCommande(@RequestBody CreateCommandeRequest request) {
        return ResponseEntity.ok(commandeService.createCommande(request));
    }

    @GetMapping("/current_pharmacien")
    public ResponseEntity<List<CommandeResponseDto>> getCommandesForCurrentPharmacien() {
        return ResponseEntity.ok(commandeService.getCommandesForCurrentPharmacien());
    }

    @GetMapping("/current_fournisseur")
    public ResponseEntity<List<CommandeResponseDto>> getCommandesForCurrentFournisseur() {
        return ResponseEntity.ok(commandeService.getCommandesForCurrentFournisseur());
    }

    @GetMapping("/all")
    public ResponseEntity<List<CommandeResponseDto>> getAllCommands() {
        return ResponseEntity.ok(commandeService.getAllCommandes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommandeResponseDto> getCommandeById(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.getCommandeById(id));
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR','PHARMACIEN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<CommandeResponseDto> updateCommandeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {

        StatutCommande newStatus = StatutCommande.valueOf(statusUpdate.get("status"));
        return ResponseEntity.ok(commandeService.updateCommandeStatus(id, newStatus));
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @PutMapping("/{id}/livree")
    public ResponseEntity<CommandeResponseDto> markCommandeAsLivree(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.updateCommandeToLivree(id));
    }
}