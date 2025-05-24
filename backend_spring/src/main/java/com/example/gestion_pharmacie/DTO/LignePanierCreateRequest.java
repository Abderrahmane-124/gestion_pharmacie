package com.example.gestion_pharmacie.DTO;

import lombok.Data;

@Data
public class LignePanierCreateRequest {
    private Long medicamentId;
    private Integer quantite;
} 