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
    private String code_ATC; 
    
    private String dosage; 
    
    private String presentation;
    
    @Column(nullable = false, columnDefinition = "float4 default 0")
    private float prix_hospitalier;

    @Column(nullable = false, columnDefinition = "float4 default 0")
    private float prix_public;
    
    private String composition;
    private String classe_therapeutique;
    
    private int quantite;
    private Date date_expiration;
    
    @Column(length = 1000)
    private String indications;

    private String natureDuProduit;
    private String tableau;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    @JsonIgnoreProperties("medicaments")
    private Utilisateur utilisateur;
}
