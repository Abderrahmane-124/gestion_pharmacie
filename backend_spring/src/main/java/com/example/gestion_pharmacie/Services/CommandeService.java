package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.CommandeResponseDto;
import com.example.gestion_pharmacie.DTO.CreateCommandeRequest;
import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.Repositorys.CommandeRepository;
import com.example.gestion_pharmacie.Repositorys.FournisseurRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommandeService {
    private final CommandeRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurService userService;

    private static final Logger logger = LoggerFactory.getLogger(CommandeService.class);


    public CommandeService(CommandeRepository commandeRepository,
                           FournisseurRepository fournisseurRepository,
                           MedicamentRepository medicamentRepository,
                           UtilisateurService userService) {
        this.commandeRepository = commandeRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.medicamentRepository = medicamentRepository;
        this.userService = userService;
    }

    @Transactional
    public CommandeResponseDto createCommande(CreateCommandeRequest request) {
        try {
            logger.info("Creating new order with supplier ID: {}", request.getFournisseurId());

            // Get current authenticated pharmacist
            Pharmacien pharmacien = userService.getCurrentPharmacien();

            // Find the supplier
            Fournisseur fournisseur = fournisseurRepository.findById(request.getFournisseurId())
                    .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé avec ID: " + request.getFournisseurId()));

            // Create the order
            Commande commande = new Commande();
            commande.setDateCommande(LocalDateTime.now());
            commande.setStatut(StatutCommande.EN_ATTENTE);
            commande.setPharmacien(pharmacien);
            commande.setFournisseur(fournisseur);

            // First save the order to get an ID
            commande = commandeRepository.save(commande);
            logger.info("Saved initial order with ID: {}", commande.getId());

            // Create order lines
            List<LigneCommande> lignesCommande = new ArrayList<>();
            for (LigneCommandeDto ligneDto : request.getLignesCommande()) {
                Medicament medicament = medicamentRepository.findById(ligneDto.getMedicamentId())
                        .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + ligneDto.getMedicamentId()));

                // Verify if the medication belongs to the specified supplier
                if (medicament.getUtilisateur() == null ||
                        !medicament.getUtilisateur().getId().equals(fournisseur.getId())) {
                    throw new RuntimeException("Le médicament " + medicament.getNom() + " n'est pas fourni par ce fournisseur");
                }

                // Verify if there's enough quantity available
                if (medicament.getQuantite() < ligneDto.getQuantite()) {
                    throw new RuntimeException("Stock insuffisant pour " + medicament.getNom() +
                            ". Disponible: " + medicament.getQuantite() +
                            ", Demandé: " + ligneDto.getQuantite());
                }

                LigneCommande ligneCommande = new LigneCommande();
                ligneCommande.setQuantite(ligneDto.getQuantite());
                ligneCommande.setMedicament(medicament);
                ligneCommande.setCommande(commande);

                lignesCommande.add(ligneCommande);
            }

            commande.setLignesCommande(lignesCommande);

            // Save and flush to ensure immediate persistence
            Commande savedCommande = commandeRepository.saveAndFlush(commande);

            logger.info("Successfully created order with ID: {}", savedCommande.getId());

            return convertToDto(savedCommande);
        } catch (Exception e) {
            logger.error("Error creating order: {}", e.getMessage(), e);
            throw e;
        }
    }




    public List<CommandeResponseDto> getCommandesForCurrentPharmacien() {
        Pharmacien pharmacien = userService.getCurrentPharmacien();
        List<Commande> commandes = commandeRepository.findByPharmacien(pharmacien);
        return commandes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<CommandeResponseDto> getCommandesForCurrentFournisseur() {
        Fournisseur fournisseur = userService.getCurrentFournisseur();
        List<Commande> commandes = commandeRepository.findByFournisseur(fournisseur);
        return commandes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

//    public List<CommandeResponseDto> getCommandesForCurrentUser() {
//        Utilisateur utilisateur = userService.getCurrentUser();
//        List<Commande> commandes = commandeRepository.findByUser(utilisateur);
//        return commandes.stream()
//                .map(this::convertToDto)
//                .collect(Collectors.toList());
//    }


    public List<CommandeResponseDto> getAllCommandes() {
        List<Commande> commandes = commandeRepository.findAll();
        return commandes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommandeResponseDto updateCommandeStatus(Long commandeId, StatutCommande newStatus) {
        logger.info("Updating order status for order ID: {} to {}", commandeId, newStatus);


        Utilisateur utilisateur = userService.getCurrentFournisseur();

        // Verify user is a supplier
        if (utilisateur.getRole() != Role.FOURNISSEUR) {
            throw new RuntimeException("Seuls les fournisseurs peuvent modifier le statut des commandes");
        }

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec ID: " + commandeId));

        // Verify this supplier is associated with the order
        if (!commande.getFournisseur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        // Update status
        commande.setStatut(newStatus);

        // If status is changed to EN_COURS_DE_LIVRAISON, subtract quantities
        if (newStatus == StatutCommande.EN_COURS_DE_LIVRAISON) {
            logger.info("Processing quantity updates for order in delivery");
            for (LigneCommande ligne : commande.getLignesCommande()) {
                Medicament medicament = ligne.getMedicament();
                int newQuantity = medicament.getQuantite() - ligne.getQuantite();

                if (newQuantity < 0) {
                    throw new RuntimeException("Stock insuffisant pour " + medicament.getNom());
                }

                medicament.setQuantite(newQuantity);
                medicamentRepository.save(medicament);
                logger.info("Updated quantity for medicament {}: {} -> {}",
                        medicament.getId(), medicament.getQuantite() + ligne.getQuantite(), medicament.getQuantite());
            }
        }

        Commande updatedCommande = commandeRepository.save(commande);
        logger.info("Successfully updated order status to: {}", newStatus);
        return convertToDto(updatedCommande);
    }

    @Transactional
    public CommandeResponseDto updateCommandeToLivree(Long commandeId) {
        logger.info("Updating order status to LIVREE for order ID: {}", commandeId);

        // Get current authenticated pharmacist
        Pharmacien pharmacien = userService.getCurrentPharmacien();

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec ID: " + commandeId));

        // Verify this pharmacist is associated with the order
        if (!commande.getPharmacien().getId().equals(pharmacien.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        // Verify the current status is EN_COURS_DE_LIVRAISON
        if (commande.getStatut() != StatutCommande.EN_COURS_DE_LIVRAISON) {
            throw new RuntimeException("Impossible de marquer comme livrée: la commande n'est pas en cours de livraison");
        }

        // Update status to LIVREE
        commande.setStatut(StatutCommande.LIVREE);

        // Process medications - add to pharmacist inventory
        for (LigneCommande ligne : commande.getLignesCommande()) {
            Medicament commandeMed = ligne.getMedicament();
            int quantite = ligne.getQuantite();

            // Check if the pharmacist already has this medication
            List<Medicament> existingMeds = medicamentRepository.findByNomAndUtilisateur(
                    commandeMed.getNom(), pharmacien);

            if (!existingMeds.isEmpty()) {
                // Update existing medication quantity
                Medicament existingMed = existingMeds.get(0);
                existingMed.setQuantite(existingMed.getQuantite() + quantite);
                medicamentRepository.save(existingMed);
                logger.info("Updated quantity for existing medication {} for pharmacist: {} -> {}",
                        existingMed.getNom(), existingMed.getQuantite() - quantite, existingMed.getQuantite());
            } else {
                // Create new medication for pharmacist
                Medicament newMed = new Medicament();
                newMed.setNom(commandeMed.getNom());
                newMed.setDescription(commandeMed.getDescription());
                newMed.setPrix_unitaire(commandeMed.getPrix_unitaire());
                newMed.setDate_expiration(commandeMed.getDate_expiration());
                newMed.setQuantite(quantite);
                newMed.setUtilisateur(pharmacien);
                medicamentRepository.save(newMed);
                logger.info("Created new medication {} for pharmacist with quantity {}", newMed.getNom(), quantite);
            }
        }

        Commande updatedCommande = commandeRepository.save(commande);
        logger.info("Successfully updated order status to LIVREE");
        return convertToDto(updatedCommande);
    }


    private CommandeResponseDto convertToDto(Commande commande) {
        CommandeResponseDto dto = new CommandeResponseDto();
        dto.setId(commande.getId());
        dto.setDateCommande(commande.getDateCommande());
        dto.setStatut(commande.getStatut().toString());

        // Map pharmacien
        CommandeResponseDto.UserBasicInfoDto pharmacienDto = new CommandeResponseDto.UserBasicInfoDto();
        pharmacienDto.setId(commande.getPharmacien().getId());
        pharmacienDto.setNom(commande.getPharmacien().getNom());
        pharmacienDto.setPrenom(commande.getPharmacien().getPrenom());
        dto.setPharmacien(pharmacienDto);

        // Map fournisseur
        CommandeResponseDto.UserBasicInfoDto fournisseurDto = new CommandeResponseDto.UserBasicInfoDto();
        fournisseurDto.setId(commande.getFournisseur().getId());
        fournisseurDto.setNom(commande.getFournisseur().getNom());
        fournisseurDto.setPrenom(commande.getFournisseur().getPrenom());
        dto.setFournisseur(fournisseurDto);

        // Map lignes commande
        List<CommandeResponseDto.LigneCommandeResponseDto> lignesDto = commande.getLignesCommande().stream()
                .map(ligne -> {
                    CommandeResponseDto.LigneCommandeResponseDto ligneDto = new CommandeResponseDto.LigneCommandeResponseDto();
                    ligneDto.setId(ligne.getId());
                    ligneDto.setQuantite(ligne.getQuantite());

                    CommandeResponseDto.MedicamentBasicDto medicamentDto = new CommandeResponseDto.MedicamentBasicDto();
                    medicamentDto.setId(ligne.getMedicament().getId());
                    medicamentDto.setNom(ligne.getMedicament().getNom());
                    medicamentDto.setPrix_unitaire(ligne.getMedicament().getPrix_unitaire());
                    medicamentDto.setQuantite(ligne.getMedicament().getQuantite());
                    ligneDto.setMedicament(medicamentDto);

                    return ligneDto;
                })
                .collect(Collectors.toList());
        dto.setLignesCommande(lignesDto);

        return dto;
    }
}