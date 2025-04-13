package com.example.gestion_pharmacie.Services;


import com.example.gestion_pharmacie.Repositorys.FournisseurRepository;
import com.example.gestion_pharmacie.Repositorys.PharmacienRepository;
import com.example.gestion_pharmacie.Repositorys.UtilisateurRepository;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class UtilisateurService {
    private final PharmacienRepository pharmacienRepository;
    private final FournisseurRepository fournisseurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UtilisateurService(PharmacienRepository pharmacienRepository,
                              FournisseurRepository fournisseurRepository, UtilisateurRepository utilisateurRepository,
                              PasswordEncoder passwordEncoder) {
        this.pharmacienRepository = pharmacienRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

//    public List<Pharmacien> getAllPharmaciens() {
//        return pharmacienRepository.findAll();
//    }
//
//    public List<Fournisseur> getAllFournisseurs() {
//        return fournisseurRepository.findAll();
//    }

    public List<Pharmacien> getAllPharmaciens() {
        // Get authenticated user's ville
        String currentUserVille = getCurrentUserVille();

        // Get all pharmaciens
        List<Pharmacien> pharmaciens = pharmacienRepository.findAll();

        // Sort pharmaciens: first those with matching ville, then others grouped by ville
        pharmaciens.sort((p1, p2) -> {
            boolean p1SameVille = p1.getVille() != null && p1.getVille().equals(currentUserVille);
            boolean p2SameVille = p2.getVille() != null && p2.getVille().equals(currentUserVille);

            if (p1SameVille == p2SameVille) {
                // If both have same status (both match or both don't), compare by ville
                return compareVilles(p1.getVille(), p2.getVille());
            }
            // Place matching ville first
            return p1SameVille ? -1 : 1;
        });

        return pharmaciens;
    }

    public List<Fournisseur> getAllFournisseurs() {
        // Get authenticated user's ville
        String currentUserVille = getCurrentUserVille();

        // Get all fournisseurs
        List<Fournisseur> fournisseurs = fournisseurRepository.findAll();

        // Sort fournisseurs: first those with matching ville, then others grouped by ville
        fournisseurs.sort((f1, f2) -> {
            boolean f1SameVille = f1.getVille() != null && f1.getVille().equals(currentUserVille);
            boolean f2SameVille = f2.getVille() != null && f2.getVille().equals(currentUserVille);

            if (f1SameVille == f2SameVille) {
                // If both have same status (both match or both don't), compare by ville
                return compareVilles(f1.getVille(), f2.getVille());
            }
            // Place matching ville first
            return f1SameVille ? -1 : 1;
        });

        return fournisseurs;
    }

    // Helper method to get the authenticated user's ville
    private String getCurrentUserVille() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return utilisateurRepository.findByEmail(email)
                .map(Utilisateur::getVille)
                .orElse("");
    }

    // Helper method to compare villes safely
    private int compareVilles(String ville1, String ville2) {
        if (ville1 == null && ville2 == null) return 0;
        if (ville1 == null) return 1;
        if (ville2 == null) return -1;
        return ville1.compareTo(ville2);
    }

    public Utilisateur getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }


    public Pharmacien getCurrentPharmacien() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return pharmacienRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Pharmacien non trouvé"));
    }

    public Fournisseur getCurrentFournisseur() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return fournisseurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
    }

    public List<Utilisateur> getAllUsers() {
        return utilisateurRepository.findAll();
    }

    public void deleteUtilisateur(Long id) {
        if (pharmacienRepository.existsById(id)) {
            pharmacienRepository.deleteById(id);
            return;
        }

        if (fournisseurRepository.existsById(id)) {
            fournisseurRepository.deleteById(id);
            return;
        }
        throw new RuntimeException("Utilisateur avec l'ID " + id + " non trouvé");
    }


}
