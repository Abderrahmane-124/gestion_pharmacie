package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.AlerteRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.Alerte;
import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AlerteService {
    private static final Logger logger = LoggerFactory.getLogger(AlerteService.class);

    private final AlerteRepository alerteRepository;
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurService userService;

    public AlerteService(AlerteRepository alerteRepository, MedicamentRepository medicamentRepository, UtilisateurService userService) {
        this.alerteRepository = alerteRepository;
        this.medicamentRepository = medicamentRepository;
        this.userService = userService;
    }

    @Transactional
    public Alerte creerAlerte(String message, int minimumQuantite, List<Long> medicamentIds) {
        logger.info("Création d'une nouvelle alerte avec {} médicaments", medicamentIds.size());

        Utilisateur utilisateur = userService.getCurrentUser();

        // Vérifier l'existence des médicaments ET que l'utilisateur en est le propriétaire
        List<Medicament> medicaments = medicamentIds.stream()
                .map(id -> {
                    Medicament medicament = medicamentRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + id));

                    // Vérifier que le médicament appartient à l'utilisateur
                    if (!medicament.getUtilisateur().getId().equals(utilisateur.getId())) {
                        throw new RuntimeException("Vous ne pouvez ajouter que vos propres médicaments à l'alerte. Médicament ID: " + id);
                    }

                    return medicament;
                })
                .collect(Collectors.toList());

        Alerte alerte = new Alerte();
        alerte.setMessage(message);
        alerte.setMinimumQuantite(minimumQuantite);
        alerte.setDateCreation(LocalDateTime.now());
        alerte.setMedicaments(medicaments);
        alerte.setUtilisateur(utilisateur);

        return alerteRepository.save(alerte);
    }

    @Transactional
    public Alerte modifierAlerte(Long alerteId, String message, int minimumQuantite, List<Long> medicamentIds) {
        logger.info("Modification de l'alerte avec ID: {}", alerteId);

        Utilisateur utilisateur = userService.getCurrentUser();

        Alerte alerte = alerteRepository.findById(alerteId)
                .orElseThrow(() -> new RuntimeException("Alerte non trouvée avec ID: " + alerteId));

        // Vérifier que l'alerte appartient à l'utilisateur
        if (!alerte.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette alerte");
        }

        // Mettre à jour les champs
        if (message != null) {
            alerte.setMessage(message);
        }

        if (minimumQuantite > 0) {
            alerte.setMinimumQuantite(minimumQuantite);
        }

        if (medicamentIds != null && !medicamentIds.isEmpty()) {
            List<Medicament> medicaments = medicamentIds.stream()
                    .map(id -> {
                        Medicament medicament = medicamentRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + id));

                        // Vérifier que le médicament appartient à l'utilisateur
                        if (!medicament.getUtilisateur().getId().equals(utilisateur.getId())) {
                            throw new RuntimeException("Vous ne pouvez ajouter que vos propres médicaments à l'alerte. Médicament ID: " + id);
                        }

                        return medicament;
                    })
                    .collect(Collectors.toList());
            alerte.setMedicaments(medicaments);
        }

        return alerteRepository.save(alerte);
    }
    @Transactional
    public void supprimerAlerte(Long alerteId) {
        logger.info("Suppression de l'alerte avec ID: {}", alerteId);

        Utilisateur utilisateur = userService.getCurrentUser();

        Alerte alerte = alerteRepository.findById(alerteId)
                .orElseThrow(() -> new RuntimeException("Alerte non trouvée avec ID: " + alerteId));

        // Vérifier que l'alerte appartient à l'utilisateur
        if (!alerte.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer cette alerte");
        }

        alerteRepository.delete(alerte);
    }

    public List<Alerte> getAlertesUtilisateur() {
        Utilisateur utilisateur = userService.getCurrentUser();
        return alerteRepository.findByUtilisateurId(utilisateur.getId());
    }
}