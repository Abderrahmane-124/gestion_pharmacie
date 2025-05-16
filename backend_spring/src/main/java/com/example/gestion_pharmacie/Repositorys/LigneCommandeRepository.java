package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Commande;
import com.example.gestion_pharmacie.entites.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {
    List<LigneCommande> findByCommande(Commande commande);
}