package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface MedicamentRepository extends JpaRepository<Medicament, Long> {
    List<Medicament> findByNomContainingIgnoreCase(String nom);
    List<Medicament> findByUtilisateurId(Long userId);
    List<Medicament> findByNomAndUtilisateur(String nom, Utilisateur utilisateur);
    
    @Query("SELECT m FROM Medicament m WHERE m.en_vente = true")
    List<Medicament> findMedicamentsEnVente();
}
