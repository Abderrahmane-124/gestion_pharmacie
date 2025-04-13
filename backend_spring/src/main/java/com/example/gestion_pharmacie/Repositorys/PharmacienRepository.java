package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Pharmacien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface PharmacienRepository extends JpaRepository<Pharmacien, Long> {
    boolean existsByEmail(String email);
    Optional<Pharmacien> findByEmail(String email);
}