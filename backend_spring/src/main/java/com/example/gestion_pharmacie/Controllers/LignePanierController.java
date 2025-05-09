package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.LignePanierCreateRequest;
import com.example.gestion_pharmacie.DTO.LignePanierResponseDto;
import com.example.gestion_pharmacie.DTO.LignePanierUpdateRequest;
import com.example.gestion_pharmacie.Services.LignePanierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lignepaniers")
public class LignePanierController {
    private final LignePanierService lignePanierService;

    public LignePanierController(LignePanierService lignePanierService) {
        this.lignePanierService = lignePanierService;
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PostMapping
    public ResponseEntity<LignePanierResponseDto> addLignePanier(@RequestBody LignePanierCreateRequest request) {
        LignePanierResponseDto response = lignePanierService.addLignePanier(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @GetMapping
    public ResponseEntity<List<LignePanierResponseDto>> getLignesPanier() {
        List<LignePanierResponseDto> lignes = lignePanierService.getLignesPanierForCurrentUser();
        return ResponseEntity.ok(lignes);
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PutMapping("/{id}")
    public ResponseEntity<LignePanierResponseDto> updateLignePanier(@PathVariable Long id, @RequestBody LignePanierUpdateRequest request) {
        LignePanierResponseDto response = lignePanierService.updateLignePanier(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLignePanier(@PathVariable Long id) {
        lignePanierService.deleteLignePanier(id);
        return ResponseEntity.noContent().build();
    }
} 