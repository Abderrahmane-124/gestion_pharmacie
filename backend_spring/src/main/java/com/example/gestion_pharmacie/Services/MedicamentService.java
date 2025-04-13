package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.FournisseurRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Repositorys.UtilisateurRepository;
import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class MedicamentService {
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ExcelLoaderService excelLoaderService;


    public MedicamentService(MedicamentRepository medicamentRepository, FournisseurRepository fournisseurRepository, UtilisateurRepository utilisateurRepository, ExcelLoaderService excelLoaderService) {
        this.medicamentRepository = medicamentRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.excelLoaderService = excelLoaderService;
    }


    public Medicament saveMedicament(Medicament medicament) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Set the current user as the owner of the medication
        medicament.setUtilisateur(utilisateur);

        return medicamentRepository.save(medicament);
    }

    public Medicament addMedicamentFromExcel(String code) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Find medicament data in Excel file
        Medicament medicament = excelLoaderService.findMedicamentByCode(code);

        if (medicament == null) {
            throw new IllegalArgumentException("Aucun médicament trouvé avec le code: " + code);
        }

        // Set default values for other fields
        medicament.setPrix_unitaire(0);
        medicament.setQuantite(0);

        // Associate with the user
        medicament.setUtilisateur(utilisateur);

        // Save to database
        return medicamentRepository.save(medicament);
    }

    public Medicament updateMedicament(Long id, Medicament medicament) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return medicamentRepository.findById(id)
                .map(existingMedicament -> {
                    // Check if the current user owns this medication
                    boolean isOwner = false;
                    if (existingMedicament.getUtilisateur() != null &&
                            existingMedicament.getUtilisateur().getId().equals(utilisateur.getId())) {
                        isOwner = true;
                    }

                    if (!isOwner) {
                        throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce médicament");
                    }

                    // Update fields
                    if (medicament.getNom() != null) existingMedicament.setNom(medicament.getNom());
                    if (medicament.getDescription() != null) existingMedicament.setDescription(medicament.getDescription());
                    if (medicament.getPrix_unitaire() != 0) existingMedicament.setPrix_unitaire(medicament.getPrix_unitaire());
                    if (medicament.getDate_expiration() != null) existingMedicament.setDate_expiration(medicament.getDate_expiration());
                    if (medicament.getQuantite() != 0) existingMedicament.setQuantite(medicament.getQuantite());

                    return medicamentRepository.save(existingMedicament);
                })
                .orElseThrow(() -> new RuntimeException("Medicament not found"));
    }

    public void deleteMedicament(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Medicament medicament = medicamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicament not found"));

        // Check if the current user owns this medication
        boolean isOwner = false;
        if (medicament.getUtilisateur() != null &&
                medicament.getUtilisateur().getId().equals(utilisateur.getId())) {
            isOwner = true;
        }

        if (!isOwner) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer ce médicament");
        }

        medicamentRepository.deleteById(id);
    }

    public List<Medicament> getUserMedicaments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Use the unified method instead of separate methods for each user type
        return medicamentRepository.findByUtilisateurId(utilisateur.getId());
    }

    public List<Medicament> getAllMedicaments() {
        return medicamentRepository.findAll();
    }

    public List<Medicament> searchMedicaments(String nom) {
        return medicamentRepository.findByNomContainingIgnoreCase(nom);
    }
}