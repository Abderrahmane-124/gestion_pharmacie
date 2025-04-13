package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Panier;
import com.example.gestion_pharmacie.entites.Pharmacien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PanierRepository extends JpaRepository<Panier, Long> {
    List<Panier> findByPharmacien(Pharmacien pharmacien);
}