package com.example.gestion_pharmacie.DTO;

public class LigneCommandeDto {
    private Long medicamentId;
    private Integer quantite;

    // Getters and setters
    public Long getMedicamentId() {
        return medicamentId;
    }

    public void setMedicamentId(Long medicamentId) {
        this.medicamentId = medicamentId;
    }

    public Integer getQuantite() {
        return quantite;
    }

    public void setQuantite(Integer quantite) {
        this.quantite = quantite;
    }
}