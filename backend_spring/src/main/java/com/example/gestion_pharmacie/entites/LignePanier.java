package com.example.gestion_pharmacie.entites;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
public class LignePanier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantite;

    @ManyToOne
    @JoinColumn(name = "medicament_id")
    private Medicament medicament;

    @ManyToOne
    @JoinColumn(name = "panier_id")
    private Panier panier;
}
