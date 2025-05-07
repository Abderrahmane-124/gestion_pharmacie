package com.example.gestion_pharmacie.DTO;

import lombok.Data;

@Data
public class LigneCommandeResponseDto {
    private Long id;
    private Integer quantite;
    private MedicamentBasicInfoDto medicament;
    private Long commandeId;

    @Data
    public static class MedicamentBasicInfoDto {
        private Long id;
        private String nom;
        private float prix_hospitalier;
        private float prix_public;
        private int quantite;
    }
}