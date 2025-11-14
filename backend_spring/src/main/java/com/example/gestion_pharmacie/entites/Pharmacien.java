package com.example.gestion_pharmacie.entites;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import lombok.*;

import java.util.List;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Pharmacien extends Utilisateur{

    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("utilisateur")
    private List<Medicament> medicaments;

    public Pharmacien() {
        this.setRole(Role.PHARMACIEN);
    }
}
