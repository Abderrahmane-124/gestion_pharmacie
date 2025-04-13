package com.example.gestion_pharmacie.DTO;

import java.util.List;

public class CreateCommandeRequest {
    private Long fournisseurId;
    private List<LigneCommandeDto> lignesCommande;

    // Getters and setters
    public Long getFournisseurId() {
        return fournisseurId;
    }

    public void setFournisseurId(Long fournisseurId) {
        this.fournisseurId = fournisseurId;
    }

    public List<LigneCommandeDto> getLignesCommande() {
        return lignesCommande;
    }

    public void setLignesCommande(List<LigneCommandeDto> lignesCommande) {
        this.lignesCommande = lignesCommande;
    }
}