package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.CreatePanierRequest;
import com.example.gestion_pharmacie.DTO.PanierResponseDto;
import com.example.gestion_pharmacie.Services.PanierService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paniers")
public class PanierController {

    private final PanierService panierService;

    public PanierController(PanierService panierService) {
        this.panierService = panierService;
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PostMapping
    public ResponseEntity<PanierResponseDto> createAndSubmitPanier(@RequestBody CreatePanierRequest request) {
        PanierResponseDto panier = panierService.createAndSubmitPanier(request);
        return new ResponseEntity<>(panier, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @GetMapping
    public ResponseEntity<List<PanierResponseDto>> getAllPaniers() {
        List<PanierResponseDto> paniers = panierService.getPaniersForCurrentPharmacien();
        return ResponseEntity.ok(paniers);
    }

    @PreAuthorize("hasRole('PHARMACIEN')")
    @PostMapping("/close")
    public ResponseEntity<PanierResponseDto> closeCurrentPanier() {
        PanierResponseDto closed = panierService.closeCurrentPanier();
        return ResponseEntity.ok(closed);
    }
}