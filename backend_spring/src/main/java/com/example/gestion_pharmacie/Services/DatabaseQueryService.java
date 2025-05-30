package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.*;
import com.example.gestion_pharmacie.entites.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class DatabaseQueryService {
    private final MedicamentRepository medicamentRepository;
    private final PharmacienRepository pharmacienRepository;
    private final CommandeRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final AlerteRepository alerteRepository;

    public DatabaseQueryService(MedicamentRepository medicamentRepository,
                                PharmacienRepository pharmacienRepository,
                                CommandeRepository commandeRepository,
                                FournisseurRepository fournisseurRepository,
                                AlerteRepository alerteRepository) {
        this.medicamentRepository = medicamentRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.commandeRepository = commandeRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.alerteRepository = alerteRepository;
    }

    public Map<String, Object> getRelevantData(String userQuery) {
        Map<String, Object> data = new HashMap<>();
        
        // Récupérer l'utilisateur authentifié
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return data;
        }

        String userEmail = auth.getName();
        Optional<Pharmacien> pharmacienOpt = pharmacienRepository.findByEmail(userEmail);
        if (pharmacienOpt.isEmpty()) {
            return data;
        }
        Pharmacien pharmacien = pharmacienOpt.get();
        
        if (userQuery.toLowerCase().contains("medicament") || userQuery.toLowerCase().contains("médicament")) {
            // Utiliser findByUtilisateur au lieu de findMedicamentsEnVente
            data.put("medicaments", formatMedicaments(medicamentRepository.findByUtilisateur(pharmacien)));
        }
        
        if (userQuery.toLowerCase().contains("pharmacien")) {
            data.put("pharmaciens", pharmacienRepository.findByEmail(userEmail));
        }
        
        if (userQuery.toLowerCase().contains("commande")) {
            // Utiliser findByPharmacien au lieu de findAll
            data.put("commandes", commandeRepository.findByPharmacien(pharmacien));
        }
        
        if (userQuery.toLowerCase().contains("fournisseur")) {
            // Récupérer les fournisseurs liés aux commandes du pharmacien
            List<Commande> commandes = commandeRepository.findByPharmacien(pharmacien);
            List<Fournisseur> fournisseurs = commandes.stream()
                .map(Commande::getFournisseur)
                .distinct()
                .collect(Collectors.toList());
            data.put("fournisseurs", fournisseurs);
        }
        
        if (userQuery.toLowerCase().contains("alerte")) {
            // Utiliser findByUtilisateurId au lieu de findAll
            data.put("alertes", alerteRepository.findByUtilisateurId(pharmacien.getId()));
        }
        
        // Add basic stats if query seems like a statistical question
        if (userQuery.toLowerCase().contains("nombre") || userQuery.toLowerCase().contains("statistique") 
            || userQuery.toLowerCase().contains("combien") || userQuery.toLowerCase().contains("total")) {
            data.put("stats", getBasicStats(pharmacien));
        }
        
        return data;
    }
    
    private List<Map<String, String>> formatMedicaments(List<Medicament> medicaments) {
        return medicaments.stream()
            .map(medicament -> {
                Map<String, String> formattedMed = new HashMap<>();
                formattedMed.put("nom", "<strong>" + medicament.getNom() + "</strong>");
                String indications = medicament.getIndications();
                if (indications != null && !indications.trim().isEmpty()) {
                    // Diviser les indications en points et les formater
                    String[] points = indications.split("\\.");
                    StringBuilder formattedIndications = new StringBuilder();
                    for (String point : points) {
                        if (!point.trim().isEmpty()) {
                            formattedIndications.append("\n• ").append(point.trim());
                        }
                    }
                    formattedMed.put("indications", formattedIndications.toString());
                } else {
                    formattedMed.put("indications", "\n• Aucune indication disponible");
                }
                return formattedMed;
            })
            .collect(Collectors.toList());
    }
    
    private Map<String, Object> getBasicStats(Pharmacien pharmacien) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMedicaments", medicamentRepository.findByUtilisateur(pharmacien).size());
        stats.put("totalCommandes", commandeRepository.findByPharmacien(pharmacien).size());
        stats.put("totalAlertes", alerteRepository.findByUtilisateurId(pharmacien.getId()).size());
        return stats;
    }
} 