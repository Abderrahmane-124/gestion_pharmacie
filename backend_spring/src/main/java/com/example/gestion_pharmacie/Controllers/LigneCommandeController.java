package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.DTO.LigneCommandeResponseDto;
import com.example.gestion_pharmacie.Services.LigneCommandeService;
import com.example.gestion_pharmacie.entites.LigneCommande;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/lignes-commande")
public class LigneCommandeController {
    private final LigneCommandeService ligneCommandeService;

    public LigneCommandeController(LigneCommandeService ligneCommandeService) {
        this.ligneCommandeService = ligneCommandeService;
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PostMapping("/commande/{commandeId}")
    public ResponseEntity<LigneCommandeResponseDto> createLigneCommande(
            @PathVariable Long commandeId,
            @RequestBody LigneCommandeDto ligneCommandeDto) {
        LigneCommande ligneCommande = ligneCommandeService.createLigneCommande(commandeId, ligneCommandeDto);
        return ResponseEntity.ok(convertToDto(ligneCommande));
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PutMapping("/{id}")
    public ResponseEntity<LigneCommandeResponseDto> updateLigneCommande(
            @PathVariable Long id,
            @RequestBody LigneCommandeDto updateDto) {
        LigneCommande ligneCommande = ligneCommandeService.updateLigneCommande(id, updateDto);
        return ResponseEntity.ok(convertToDto(ligneCommande));
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLigneCommande(@PathVariable Long id) {
        ligneCommandeService.deleteLigneCommande(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/commande/{commandeId}")
    public ResponseEntity<List<LigneCommandeResponseDto>> getLignesCommandeByCommande(@PathVariable Long commandeId) {
        List<LigneCommande> lignesCommande = ligneCommandeService.getLignesCommandeByCommande(commandeId);
        List<LigneCommandeResponseDto> lignesCommandeDto = lignesCommande.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lignesCommandeDto);
    }

    @GetMapping("/all")
    public ResponseEntity<List<LigneCommandeResponseDto>> getAllLigneCommandes() {
        List<LigneCommande> ligneCommandes = ligneCommandeService.getAllLigneCommandes();
        List<LigneCommandeResponseDto> dtoList = ligneCommandes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    private LigneCommandeResponseDto convertToDto(LigneCommande ligneCommande) {
        LigneCommandeResponseDto dto = new LigneCommandeResponseDto();
        dto.setId(ligneCommande.getId());
        dto.setQuantite(ligneCommande.getQuantite());
        dto.setCommandeId(ligneCommande.getCommande().getId());

        LigneCommandeResponseDto.MedicamentBasicInfoDto medicamentDto = new LigneCommandeResponseDto.MedicamentBasicInfoDto();
        medicamentDto.setId(ligneCommande.getMedicament().getId());
        medicamentDto.setNom(ligneCommande.getMedicament().getNom());
        medicamentDto.setPrix_hospitalier(ligneCommande.getMedicament().getPrix_hospitalier());
        medicamentDto.setPrix_public(ligneCommande.getMedicament().getPrix_public());
        medicamentDto.setQuantite(ligneCommande.getMedicament().getQuantite());
        dto.setMedicament(medicamentDto);

        return dto;
    }
}