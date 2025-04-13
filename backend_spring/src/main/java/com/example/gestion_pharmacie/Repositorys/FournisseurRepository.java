package com.example.gestion_pharmacie.Repositorys;


import com.example.gestion_pharmacie.entites.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
    boolean existsByEmail(String email);
    Optional<Fournisseur> findByEmail(String email);
}
