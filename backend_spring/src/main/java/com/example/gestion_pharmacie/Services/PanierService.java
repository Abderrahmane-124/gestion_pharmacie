package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.CreatePanierRequest;
import com.example.gestion_pharmacie.DTO.PanierResponseDto;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Repositorys.PanierRepository;
import com.example.gestion_pharmacie.entites.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PanierService {
    private static final Logger logger = LoggerFactory.getLogger(PanierService.class);

    private final PanierRepository panierRepository;
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurService utilisateurService;

    public PanierService(PanierRepository panierRepository,
                         MedicamentRepository medicamentRepository,
                         UtilisateurService utilisateurService) {
        this.panierRepository = panierRepository;
        this.medicamentRepository = medicamentRepository;
        this.utilisateurService = utilisateurService;
    }

    @Transactional
    public PanierResponseDto createAndSubmitPanier(CreatePanierRequest request) {
        logger.info("Creating and submitting new cart with {} items", request.getItems().size());

        // Get current pharmacist
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();

        // Create new cart
        Panier panier = new Panier();
        panier.setDateCreation(LocalDateTime.now());
        panier.setPharmacien(pharmacien);
        panier.setLignesPanier(new ArrayList<>());

        // Process all items and validate them
        for (CreatePanierRequest.PanierItemDto item : request.getItems()) {
            Medicament medicament = medicamentRepository.findById(item.getMedicamentId())
                    .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + item.getMedicamentId()));

            // Verify medication belongs to pharmacist
            if (!medicament.getUtilisateur().getId().equals(pharmacien.getId())) {
                logger.error("Medication ID {} does not belong to pharmacist ID {}",
                        medicament.getId(), pharmacien.getId());
                throw new RuntimeException("Le médicament " + medicament.getNom() + " ne vous appartient pas");
            }

            // Check sufficient quantity
            if (medicament.getQuantite() < item.getQuantite()) {
                logger.error("Insufficient quantity for medication {}: requested {}, available {}",
                        medicament.getId(), item.getQuantite(), medicament.getQuantite());
                throw new RuntimeException("Quantité insuffisante pour " + medicament.getNom() +
                        " (disponible: " + medicament.getQuantite() + ", demandé: " + item.getQuantite() + ")");
            }

            // Add to cart
            LignePanier lignePanier = new LignePanier();
            lignePanier.setMedicament(medicament);
            lignePanier.setQuantite(item.getQuantite());
            lignePanier.setPanier(panier);
            panier.getLignesPanier().add(lignePanier);

            // Update quantity
            medicament.setQuantite(medicament.getQuantite() - item.getQuantite());
            medicamentRepository.save(medicament);
            logger.info("Updated quantity for medicament {}: {} -> {}",
                    medicament.getId(), medicament.getQuantite() + item.getQuantite(), medicament.getQuantite());
        }

        // Save the cart with all items
        Panier savedPanier = panierRepository.save(panier);
        logger.info("Successfully created and submitted cart with ID: {}", savedPanier.getId());

        return convertToDto(savedPanier);
    }

    public List<PanierResponseDto> getPaniersForCurrentPharmacien() {
        logger.info("Fetching all carts for current pharmacist");

        // Get current pharmacist
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();

        // Find all carts for this pharmacist
        List<Panier> paniers = panierRepository.findByPharmacien(pharmacien);

        return paniers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private PanierResponseDto convertToDto(Panier panier) {
        PanierResponseDto dto = new PanierResponseDto();
        dto.setId(panier.getId());
        dto.setDateCreation(panier.getDateCreation());

        List<PanierResponseDto.LignePanierDto> lignesDto = panier.getLignesPanier().stream()
                .map(ligne -> {
                    PanierResponseDto.LignePanierDto ligneDto = new PanierResponseDto.LignePanierDto();
                    ligneDto.setId(ligne.getId());
                    ligneDto.setQuantite(ligne.getQuantite());

                    PanierResponseDto.MedicamentDto medicamentDto = new PanierResponseDto.MedicamentDto();
                    medicamentDto.setId(ligne.getMedicament().getId());
                    medicamentDto.setNom(ligne.getMedicament().getNom());
                    medicamentDto.setPrix_unitaire(ligne.getMedicament().getPrix_unitaire());
                    medicamentDto.setQuantite(ligne.getMedicament().getQuantite());
                    ligneDto.setMedicament(medicamentDto);

                    return ligneDto;
                })
                .collect(Collectors.toList());

        dto.setLignesPanier(lignesDto);
        return dto;
    }
}