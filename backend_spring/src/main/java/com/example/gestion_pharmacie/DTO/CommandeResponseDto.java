package com.example.gestion_pharmacie.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommandeResponseDto {
    private Long id;
    private LocalDateTime dateCommande;
    private String statut;

    private UserBasicInfoDto pharmacien;
    private UserBasicInfoDto fournisseur;
    private List<LigneCommandeResponseDto> lignesCommande;

    @Data
    public static class UserBasicInfoDto {
        private Long id;
        private String nom;
        private String prenom;
    }

    @Data
    public static class LigneCommandeResponseDto {
        private Long id;
        private Integer quantite;
        private MedicamentBasicDto medicament;
    }

    @Data
    public static class MedicamentBasicDto {
        private Long id;
        private String nom;
        private float prix_hospitalier;
        private float prix_public;
        private int quantite;
    }
}