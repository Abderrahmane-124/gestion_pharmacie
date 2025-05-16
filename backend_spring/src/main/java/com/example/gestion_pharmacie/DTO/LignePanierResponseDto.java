package com.example.gestion_pharmacie.DTO;

import lombok.Data;

@Data
public class LignePanierResponseDto {
    private Long id;
    private Integer quantite;
    private MedicamentDto medicament;
    private Long panierId;

    @Data
    public static class MedicamentDto {
        private Long id;
        private String nom;
        private float prix_hospitalier;
        private float prix_public;
        private Integer quantite;
    }
} 