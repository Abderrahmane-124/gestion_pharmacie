package com.example.gestion_pharmacie.Repositorys;

import com.example.gestion_pharmacie.entites.Alerte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlerteRepository extends JpaRepository<Alerte, Long> {
    List<Alerte> findByUtilisateurId(Long userId);
    List<Alerte> findByMedicamentsId(Long medicamentId);

}
