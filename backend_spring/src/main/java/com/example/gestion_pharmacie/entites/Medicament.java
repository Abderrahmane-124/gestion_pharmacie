package com.example.gestion_pharmacie.entites;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Data
public class Medicament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String description;
    private float prix_unitaire;
    private Date date_expiration;
    private int quantite;


    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    @JsonIgnoreProperties("medicaments")
    private Utilisateur utilisateur;



}
