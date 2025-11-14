package com.example.gestion_pharmacie.entites;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;



@Entity
@Data
public class Panier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateCreation;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean vendu = false;


    @ManyToOne
    @JoinColumn(name = "pharmacien_id")
    private Pharmacien pharmacien;

    @OneToMany(mappedBy = "panier", cascade = CascadeType.ALL)
    private List<LignePanier> lignesPanier;
}
