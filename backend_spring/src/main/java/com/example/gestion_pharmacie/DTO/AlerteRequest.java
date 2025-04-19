package com.example.gestion_pharmacie.DTO;

import java.util.List;

public class AlerteRequest {
    private String message;
    private int minimumQuantite;
    private List<Long> medicamentIds;

    // Getters and setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getMinimumQuantite() {
        return minimumQuantite;
    }

    public void setMinimumQuantite(int minimumQuantite) {
        this.minimumQuantite = minimumQuantite;
    }

    public List<Long> getMedicamentIds() {
        return medicamentIds;
    }

    public void setMedicamentIds(List<Long> medicamentIds) {
        this.medicamentIds = medicamentIds;
    }
}
