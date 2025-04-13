package com.example.gestion_pharmacie.DTO;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PanierResponseDto {
    private Long id;
    private LocalDateTime dateCreation;
    private List<LignePanierDto> lignesPanier;

    @Data
    public static class LignePanierDto {
        private Long id;
        private Integer quantite;
        private MedicamentDto medicament;
    }

    @Data
    public static class MedicamentDto {
        private Long id;
        private String nom;
        private double prix_unitaire;
        private Integer quantite;
    }
}