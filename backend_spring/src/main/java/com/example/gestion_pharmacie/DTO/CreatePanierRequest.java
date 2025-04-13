package com.example.gestion_pharmacie.DTO;

import lombok.Data;
import java.util.List;

@Data
public class CreatePanierRequest {
    private List<PanierItemDto> items;

    @Data
    public static class PanierItemDto {
        private Long medicamentId;
        private Integer quantite;
    }
}