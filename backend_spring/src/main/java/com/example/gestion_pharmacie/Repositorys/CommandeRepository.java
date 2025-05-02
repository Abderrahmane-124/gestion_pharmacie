package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Commande;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Pharmacien;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<Commande> findByPharmacien(Pharmacien pharmacien);
    List<Commande> findByFournisseur(Fournisseur fournisseur);

}