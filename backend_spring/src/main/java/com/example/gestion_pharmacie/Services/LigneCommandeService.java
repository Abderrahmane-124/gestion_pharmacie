package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.Repositorys.CommandeRepository;
import com.example.gestion_pharmacie.Repositorys.LigneCommandeRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LigneCommandeService {
    private final LigneCommandeRepository ligneCommandeRepository;
    private final CommandeRepository commandeRepository;
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurService utilisateurService;


    private static final Logger logger = LoggerFactory.getLogger(LigneCommandeService.class);

    public LigneCommandeService(
            LigneCommandeRepository ligneCommandeRepository,
            CommandeRepository commandeRepository,
            MedicamentRepository medicamentRepository,
            UtilisateurService utilisateurService) {
        this.ligneCommandeRepository = ligneCommandeRepository;
        this.commandeRepository = commandeRepository;
        this.medicamentRepository = medicamentRepository;
        this.utilisateurService = utilisateurService;
    }

    @Transactional
    public LigneCommande createLigneCommande(Long commandeId, LigneCommandeDto ligneCommandeDto) {
        logger.info("Creating new ligne commande for commande ID: {} with medicament ID: {}", 
                commandeId, ligneCommandeDto.getMedicamentId());

        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec ID: " + commandeId));

        // Vérifier que la commande est en attente
        if (commande.getStatut() != StatutCommande.EN_COURS_DE_CREATION) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        // Vérifier que l'utilisateur est le pharmacien propriétaire de la commande
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();
        if (!commande.getPharmacien().getId().equals(pharmacien.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        Medicament medicament = medicamentRepository.findById(ligneCommandeDto.getMedicamentId())
                .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + ligneCommandeDto.getMedicamentId()));

        // Vérifier si le médicament appartient au fournisseur spécifié
        if (medicament.getUtilisateur() == null ||
                !medicament.getUtilisateur().getId().equals(commande.getFournisseur().getId())) {
            throw new RuntimeException("Le médicament " + medicament.getNom() + " n'est pas fourni par ce fournisseur");
        }

        // Vérifier s'il y a assez de quantité disponible
        if (medicament.getQuantite() < ligneCommandeDto.getQuantite()) {
            throw new RuntimeException("Stock insuffisant pour " + medicament.getNom() +
                    ". Disponible: " + medicament.getQuantite() +
                    ", Demandé: " + ligneCommandeDto.getQuantite());
        }

        LigneCommande ligneCommande = new LigneCommande();
        ligneCommande.setQuantite(ligneCommandeDto.getQuantite());
        ligneCommande.setMedicament(medicament);
        ligneCommande.setCommande(commande);

        LigneCommande savedLigneCommande = ligneCommandeRepository.save(ligneCommande);
        
        // Mettre à jour la liste des lignes de commande dans la commande
        commande.getLignesCommande().add(savedLigneCommande);
        commandeRepository.save(commande);
        
        logger.info("Successfully created ligne commande with ID: {}", savedLigneCommande.getId());
        
        return savedLigneCommande;
    }

    @Transactional
    public LigneCommande updateLigneCommande(Long ligneCommandeId, LigneCommandeDto updateDto) {
        logger.info("Updating ligne commande with ID: {}", ligneCommandeId);

        LigneCommande ligneCommande = ligneCommandeRepository.findById(ligneCommandeId)
                .orElseThrow(() -> new RuntimeException("Ligne de commande non trouvée avec ID: " + ligneCommandeId));

        Commande commande = ligneCommande.getCommande();

        // Vérifier que la commande est en attente
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        // Vérifier que l'utilisateur est le pharmacien propriétaire de la commande
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();
        if (!commande.getPharmacien().getId().equals(pharmacien.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        // Si l'ID du médicament est différent, vérifier le nouveau médicament
        if (updateDto.getMedicamentId() != null && !updateDto.getMedicamentId().equals(ligneCommande.getMedicament().getId())) {
            Medicament newMedicament = medicamentRepository.findById(updateDto.getMedicamentId())
                    .orElseThrow(() -> new RuntimeException("Médicament non trouvé avec ID: " + updateDto.getMedicamentId()));

            // Vérifier si le médicament appartient au fournisseur spécifié
            if (newMedicament.getUtilisateur() == null ||
                    !newMedicament.getUtilisateur().getId().equals(commande.getFournisseur().getId())) {
                throw new RuntimeException("Le médicament " + newMedicament.getNom() + " n'est pas fourni par ce fournisseur");
            }

            // Vérifier s'il y a assez de quantité disponible
            if (newMedicament.getQuantite() < updateDto.getQuantite()) {
                throw new RuntimeException("Stock insuffisant pour " + newMedicament.getNom() +
                        ". Disponible: " + newMedicament.getQuantite() +
                        ", Demandé: " + updateDto.getQuantite());
            }

            ligneCommande.setMedicament(newMedicament);
        }

        // Mettre à jour la quantité si fournie
        if (updateDto.getQuantite() != null) {
            // Si le médicament n'a pas changé, vérifier le stock avec la nouvelle quantité
            if (updateDto.getMedicamentId() == null || updateDto.getMedicamentId().equals(ligneCommande.getMedicament().getId())) {
                if (ligneCommande.getMedicament().getQuantite() < updateDto.getQuantite()) {
                    throw new RuntimeException("Stock insuffisant pour " + ligneCommande.getMedicament().getNom() +
                            ". Disponible: " + ligneCommande.getMedicament().getQuantite() +
                            ", Demandé: " + updateDto.getQuantite());
                }
            }
            ligneCommande.setQuantite(updateDto.getQuantite());
        }

        LigneCommande updatedLigneCommande = ligneCommandeRepository.save(ligneCommande);
        logger.info("Successfully updated ligne commande with ID: {}", updatedLigneCommande.getId());
        
        return updatedLigneCommande;
    }

    @Transactional
    public void deleteLigneCommande(Long ligneCommandeId) {
        logger.info("Deleting ligne commande with ID: {}", ligneCommandeId);

        LigneCommande ligneCommande = ligneCommandeRepository.findById(ligneCommandeId)
                .orElseThrow(() -> new RuntimeException("Ligne de commande non trouvée avec ID: " + ligneCommandeId));

        Commande commande = ligneCommande.getCommande();

        // Vérifier que la commande est en attente
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier une commande qui n'est pas en attente");
        }

        // Vérifier que l'utilisateur est le pharmacien propriétaire de la commande
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();
        if (!commande.getPharmacien().getId().equals(pharmacien.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette commande");
        }

        // Supprimer la ligne de commande
        commande.getLignesCommande().remove(ligneCommande);
        ligneCommandeRepository.delete(ligneCommande);
        
        logger.info("Successfully deleted ligne commande with ID: {}", ligneCommandeId);
    }

    public List<LigneCommande> getLignesCommandeByCommande(Long commandeId) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec ID: " + commandeId));

        return ligneCommandeRepository.findByCommande(commande);
    }

    @Transactional(readOnly = true)
    public List<LigneCommande> getAllLigneCommandes() {
        logger.info("Retrieving all lignes commande");
        return ligneCommandeRepository.findAll();
    }
}