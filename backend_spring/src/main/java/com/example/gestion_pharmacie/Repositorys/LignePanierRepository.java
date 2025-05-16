package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.LignePanier;
import com.example.gestion_pharmacie.entites.Panier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LignePanierRepository extends JpaRepository<LignePanier, Long> {
    List<LignePanier> findByPanier(Panier panier);
} 