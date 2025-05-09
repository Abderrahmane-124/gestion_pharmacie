package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.LignePanierCreateRequest;
import com.example.gestion_pharmacie.DTO.LignePanierResponseDto;
import com.example.gestion_pharmacie.DTO.LignePanierUpdateRequest;
import com.example.gestion_pharmacie.Repositorys.LignePanierRepository;
import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Repositorys.PanierRepository;
import com.example.gestion_pharmacie.entites.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LignePanierService {
    private final LignePanierRepository lignePanierRepository;
    private final PanierRepository panierRepository;
    private final MedicamentRepository medicamentRepository;
    private final UtilisateurService utilisateurService;

    public LignePanierService(LignePanierRepository lignePanierRepository,
                              PanierRepository panierRepository,
                              MedicamentRepository medicamentRepository,
                              UtilisateurService utilisateurService) {
        this.lignePanierRepository = lignePanierRepository;
        this.panierRepository = panierRepository;
        this.medicamentRepository = medicamentRepository;
        this.utilisateurService = utilisateurService;
    }

    @Transactional
    public LignePanierResponseDto addLignePanier(LignePanierCreateRequest request) {
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();
        Panier panier = getOrCreateCurrentPanier(pharmacien);
        Medicament medicament = medicamentRepository.findById(request.getMedicamentId())
                .orElseThrow(() -> new RuntimeException("Médicament non trouvé"));
        if (!medicament.getUtilisateur().getId().equals(pharmacien.getId())) {
            throw new RuntimeException("Le médicament ne vous appartient pas");
        }
        if (medicament.getQuantite() < request.getQuantite()) {
            throw new RuntimeException("Quantité insuffisante");
        }
        LignePanier lignePanier = new LignePanier();
        lignePanier.setMedicament(medicament);
        lignePanier.setQuantite(request.getQuantite());
        lignePanier.setPanier(panier);
        medicament.setQuantite(medicament.getQuantite() - request.getQuantite());
        medicamentRepository.save(medicament);
        LignePanier saved = lignePanierRepository.save(lignePanier);
        return convertToDto(saved);
    }

    public List<LignePanierResponseDto> getLignesPanierForCurrentUser() {
        Pharmacien pharmacien = utilisateurService.getCurrentPharmacien();
        Panier panier = getOrCreateCurrentPanier(pharmacien);
        return lignePanierRepository.findByPanier(panier)
                .stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public LignePanierResponseDto updateLignePanier(Long id, LignePanierUpdateRequest request) {
        LignePanier lignePanier = lignePanierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LignePanier non trouvée"));
        Medicament medicament = lignePanier.getMedicament();
        int diff = request.getQuantite() - lignePanier.getQuantite();
        if (medicament.getQuantite() < diff) {
            throw new RuntimeException("Quantité insuffisante pour mise à jour");
        }
        medicament.setQuantite(medicament.getQuantite() - diff);
        medicamentRepository.save(medicament);
        lignePanier.setQuantite(request.getQuantite());
        LignePanier saved = lignePanierRepository.save(lignePanier);
        return convertToDto(saved);
    }

    @Transactional
    public void deleteLignePanier(Long id) {
        LignePanier lignePanier = lignePanierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LignePanier non trouvée"));
        Medicament medicament = lignePanier.getMedicament();
        medicament.setQuantite(medicament.getQuantite() + lignePanier.getQuantite());
        medicamentRepository.save(medicament);
        lignePanierRepository.delete(lignePanier);
    }

    private Panier getOrCreateCurrentPanier(Pharmacien pharmacien) {
        List<Panier> paniers = panierRepository.findByPharmacien(pharmacien);
        return paniers.stream().filter(p -> !p.isVendu()).findFirst()
                .orElseGet(() -> {
                    Panier p = new Panier();
                    p.setPharmacien(pharmacien);
                    p.setDateCreation(java.time.LocalDateTime.now());
                    p.setVendu(false);
                    return panierRepository.save(p);
                });
    }

    private LignePanierResponseDto convertToDto(LignePanier ligne) {
        LignePanierResponseDto dto = new LignePanierResponseDto();
        dto.setId(ligne.getId());
        dto.setQuantite(ligne.getQuantite());
        dto.setPanierId(ligne.getPanier().getId());
        LignePanierResponseDto.MedicamentDto medicamentDto = new LignePanierResponseDto.MedicamentDto();
        medicamentDto.setId(ligne.getMedicament().getId());
        medicamentDto.setNom(ligne.getMedicament().getNom());
        medicamentDto.setPrix_hospitalier(ligne.getMedicament().getPrix_hospitalier());
        medicamentDto.setPrix_public(ligne.getMedicament().getPrix_public());
        medicamentDto.setQuantite(ligne.getMedicament().getQuantite());
        dto.setMedicament(medicamentDto);
        return dto;
    }
} 