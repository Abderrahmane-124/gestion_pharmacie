package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.*;
import com.example.gestion_pharmacie.entites.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        
        if (userQuery.toLowerCase().contains("medicament") || userQuery.toLowerCase().contains("médicament")) {
            data.put("medicaments", medicamentRepository.findAll());
        }
        
        if (userQuery.toLowerCase().contains("pharmacien")) {
            data.put("pharmaciens", pharmacienRepository.findAll());
        }
        
        if (userQuery.toLowerCase().contains("commande")) {
            data.put("commandes", commandeRepository.findAll());
        }
        
        if (userQuery.toLowerCase().contains("fournisseur")) {
            data.put("fournisseurs", fournisseurRepository.findAll());
        }
        
        if (userQuery.toLowerCase().contains("alerte")) {
            data.put("alertes", alerteRepository.findAll());
        }
        
        // Add basic stats if query seems like a statistical question
        if (userQuery.toLowerCase().contains("nombre") || userQuery.toLowerCase().contains("statistique") 
            || userQuery.toLowerCase().contains("combien") || userQuery.toLowerCase().contains("total")) {
            data.put("stats", getBasicStats());
        }
        
        return data;
    }
    
    private Map<String, Object> getBasicStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMedicaments", medicamentRepository.count());
        stats.put("totalPharmaciens", pharmacienRepository.count());
        stats.put("totalCommandes", commandeRepository.count());
        stats.put("totalFournisseurs", fournisseurRepository.count());
        stats.put("totalAlertes", alerteRepository.count());
        return stats;
    }
} 