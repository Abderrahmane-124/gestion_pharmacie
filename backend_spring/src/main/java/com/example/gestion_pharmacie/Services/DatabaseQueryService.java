package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.*;
import com.example.gestion_pharmacie.entites.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DatabaseQueryService {
    private final MedicamentRepository medicamentRepository;
    private final PharmacienRepository pharmacienRepository;
    private final FournisseurRepository fournisseurRepository;
    private final CommandeRepository commandeRepository;
    private final LigneCommandeRepository ligneCommandeRepository;
    private final AlerteRepository alerteRepository;
    private final PanierRepository panierRepository;

    public DatabaseQueryService(MedicamentRepository medicamentRepository,
                                PharmacienRepository pharmacienRepository,
                                FournisseurRepository fournisseurRepository,
                                CommandeRepository commandeRepository,
                                LigneCommandeRepository ligneCommandeRepository,
                                AlerteRepository alerteRepository,
                                PanierRepository panierRepository) {
        this.medicamentRepository = medicamentRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.commandeRepository = commandeRepository;
        this.ligneCommandeRepository = ligneCommandeRepository;
        this.alerteRepository = alerteRepository;
        this.panierRepository = panierRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRelevantData(String userQuery) {
        Map<String, Object> data = new HashMap<>();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return data;
        }

        String userEmail = auth.getName();

        Optional<Pharmacien> pharmacienOpt = pharmacienRepository.findByEmail(userEmail);
        Optional<Fournisseur> fournisseurOpt = pharmacienOpt.isEmpty() ? fournisseurRepository.findByEmail(userEmail) : Optional.empty();

        // Intent detection (loose, supports EN/FR and common misspellings)
        String q = Optional.ofNullable(userQuery).orElse("").toLowerCase();
        boolean asksMeds = q.contains("medicament") || q.contains("médicament") || q.contains("medicine") || q.contains("medicin") || q.contains("drug") || q.contains("drugs") || q.contains("pill") || q.contains("pills") || q.contains("meds")
                || q.contains("supply") || q.contains("supplies") || q.contains("supplied")
                || q.contains("provide") || q.contains("provides") || q.contains("provided")
                || q.contains("have") || q.contains("has") || q.contains("having")
                || q.contains("possess") || q.contains("posess") || q.contains("possession")
                || q.contains("stock") || q.contains("stocked") || q.contains("stocking")
                || q.contains("carry") || q.contains("carries") || q.contains("carried")
                || q.contains("sell") || q.contains("sells") || q.contains("selling")
                || q.contains("offer") || q.contains("offers") || q.contains("offering");
        boolean asksCommandes = q.contains("commande") || q.contains("order") || q.contains("orders");
        boolean asksFournisseurs = q.contains("fournisseur") || q.contains("supplier") || q.contains("suppliers");
        boolean asksPharmaciens = q.contains("pharmacien") || q.contains("pharmacist") || q.contains("pharmacists");
        boolean asksAlertes = q.contains("alerte") || q.contains("alert") || q.contains("alerts");
        boolean asksPaniers = q.contains("panier") || q.contains("cart") || q.contains("basket") || q.contains("vente") || q.contains("sale") || q.contains("sell");
        boolean asksStats = q.contains("nombre") || q.contains("statistique") || q.contains("combien") || q.contains("total") || q.contains("count") || q.contains("how many") || q.contains("stats");

        // Pharmacien context
        if (pharmacienOpt.isPresent()) {
            Pharmacien pharmacien = pharmacienOpt.get();
            data.put("role", "PHARMACIEN");

            if (asksMeds) {
                data.put("medicaments", formatMedicaments(medicamentRepository.findByUtilisateur(pharmacien)));
            }
            // Always expose commandes/alertes/paniers for pharmacist so RAG can use them
            List<Commande> commandes = commandeRepository.findByPharmacien(pharmacien);
            data.put("commandes", commandes);
            if (asksAlertes) {
                data.put("alertes", alerteRepository.findByUtilisateurId(pharmacien.getId()));
            }
            if (asksPaniers) {
                data.put("paniers", panierRepository.findByPharmacien(pharmacien));
            }
            if (asksStats) {
                data.put("stats", getPharmacienStats(pharmacien));
            }
            return data;
        }

        // Fournisseur context
        if (fournisseurOpt.isPresent()) {
            Fournisseur fournisseur = fournisseurOpt.get();
            data.put("role", "FOURNISSEUR");

            if (asksMeds) {
                List<Medicament> meds = collectMedicamentsForFournisseur(fournisseur);
                // Fallback: include supplier's own medicaments if no commandes yet
                if (meds.isEmpty()) {
                    meds = medicamentRepository.findByUtilisateur(fournisseur);
                }
                // Optional: filter by a specific name mentioned (e.g., "doliprane")
                String specific = extractSpecificMedName(q);
                if (specific != null) {
                    List<Medicament> filtered = meds.stream()
                        .filter(m -> m.getNom() != null && m.getNom().toLowerCase().contains(specific))
                        .collect(Collectors.toList());
                    if (!filtered.isEmpty()) {
                        meds = filtered; // only keep matches if any
                    }
                }
                data.put("medicaments", formatMedicaments(meds));
            }
            if (asksCommandes) {
                data.put("commandes", commandeRepository.findByFournisseur(fournisseur));
            }
            if (asksPharmaciens) {
                // Pharmaciens this supplier has worked with
                List<Commande> commandes = commandeRepository.findByFournisseur(fournisseur);
                List<Pharmacien> pharmaciens = commandes.stream()
                        .map(Commande::getPharmacien)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
                data.put("pharmaciens", pharmaciens);
            }
            if (asksAlertes) {
                // Aggregate alerts related to meds shipped by this supplier (best-effort)
                List<Medicament> meds = collectMedicamentsForFournisseur(fournisseur);
                List<Alerte> alertes = meds.stream()
                        .map(m -> alerteRepository.findByMedicamentsId(m.getId()))
                        .filter(Objects::nonNull)
                        .flatMap(List::stream)
                        .distinct()
                        .collect(Collectors.toList());
                data.put("alertes", alertes);
            }
            if (asksStats) {
                data.put("stats", getFournisseurStats(fournisseur));
            }
            return data;
        }

        // Fallback generic user (no specific role found)
        data.put("role", "UTILISATEUR");
        if (asksMeds) {
            // Publicly available meds (en_vente)
            data.put("medicaments", formatMedicaments(medicamentRepository.findMedicamentsEnVente()));
        }
        if (asksStats) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalMedicamentsEnVente", medicamentRepository.findMedicamentsEnVente().size());
            data.put("stats", stats);
        }
        return data;
    }

    private List<Medicament> collectMedicamentsForFournisseur(Fournisseur fournisseur) {
        List<Commande> commandes = commandeRepository.findByFournisseur(fournisseur);
        Set<Medicament> meds = new LinkedHashSet<>();
        for (Commande c : commandes) {
            List<LigneCommande> lignes = (c.getLignesCommande() != null && !c.getLignesCommande().isEmpty())
                    ? c.getLignesCommande()
                    : ligneCommandeRepository.findByCommande(c);
            for (LigneCommande l : lignes) {
                if (l.getMedicament() != null) {
                    meds.add(l.getMedicament());
                }
            }
        }
        return new ArrayList<>(meds);
    }

    private Map<String, Object> getPharmacienStats(Pharmacien pharmacien) {
        Map<String, Object> stats = new HashMap<>();
        List<Medicament> meds = medicamentRepository.findByUtilisateur(pharmacien);
        List<Commande> commandes = commandeRepository.findByPharmacien(pharmacien);
        stats.put("totalMedicaments", meds.size());
        stats.put("totalCommandes", commandes.size());
        stats.put("totalAlertes", alerteRepository.findByUtilisateurId(pharmacien.getId()).size());
        return stats;
    }

    private Map<String, Object> getFournisseurStats(Fournisseur fournisseur) {
        Map<String, Object> stats = new HashMap<>();
        List<Commande> commandes = commandeRepository.findByFournisseur(fournisseur);
        int lignesTotal = 0;
        Set<Pharmacien> pharmaciens = new HashSet<>();
        for (Commande c : commandes) {
            pharmaciens.add(c.getPharmacien());
            List<LigneCommande> lignes = (c.getLignesCommande() != null && !c.getLignesCommande().isEmpty())
                    ? c.getLignesCommande()
                    : ligneCommandeRepository.findByCommande(c);
            for (LigneCommande l : lignes) {
                if (l.getQuantite() != null) {
                    lignesTotal += l.getQuantite();
                }
            }
        }
        stats.put("totalCommandes", commandes.size());
        stats.put("totalLignesCommandes", lignesTotal);
        stats.put("pharmaciensUniques", pharmaciens.stream().filter(Objects::nonNull).distinct().count());
        return stats;
    }

    private List<Map<String, String>> formatMedicaments(List<Medicament> medicaments) {
        return medicaments.stream()
                .filter(Objects::nonNull)
                .map(medicament -> {
                    Map<String, String> formattedMed = new LinkedHashMap<>();

                    // Core identification
                    formattedMed.put("id", medicament.getId() != null ? medicament.getId().toString() : "");
                    formattedMed.put("nom", Optional.ofNullable(medicament.getNom()).orElse(""));
                    formattedMed.put("code_ATC", Optional.ofNullable(medicament.getCode_ATC()).orElse(""));

                    // Presentation / dosage
                    formattedMed.put("dosage", Optional.ofNullable(medicament.getDosage()).orElse(""));
                    formattedMed.put("presentation", Optional.ofNullable(medicament.getPresentation()).orElse(""));

                    // Pricing (use hospitalier/public/conseille as strings)
                    formattedMed.put("prix_hospitalier", String.valueOf(medicament.getPrix_hospitalier()));
                    formattedMed.put("prix_public", String.valueOf(medicament.getPrix_public()));
                    formattedMed.put("prix_conseille", String.valueOf(medicament.getPrix_conseille()));

                    // Therapeutic info
                    formattedMed.put("composition", Optional.ofNullable(medicament.getComposition()).orElse(""));
                    formattedMed.put("classe_therapeutique", Optional.ofNullable(medicament.getClasse_therapeutique()).orElse(""));
                    formattedMed.put("indications", Optional.ofNullable(medicament.getIndications()).orElse(""));

                    // Stock & expiration
                    formattedMed.put("quantite", String.valueOf(medicament.getQuantite()));
                    formattedMed.put("date_expiration", medicament.getDate_expiration() != null ? medicament.getDate_expiration().toString() : "");

                    // Regulatory / classification
                    formattedMed.put("natureDuProduit", Optional.ofNullable(medicament.getNatureDuProduit()).orElse(""));
                    formattedMed.put("tableau", Optional.ofNullable(medicament.getTableau()).orElse(""));
                    formattedMed.put("en_vente", String.valueOf(medicament.isEn_vente()));

                    // Ownership / provenance (no sensitive details)
                    if (medicament.getUtilisateur() != null) {
                        formattedMed.put("proprietaireId", medicament.getUtilisateur().getId() != null ? medicament.getUtilisateur().getId().toString() : "");
                        formattedMed.put("proprietaireRole", medicament.getUtilisateur().getRole() != null ? medicament.getUtilisateur().getRole().name() : "");
                    }

                    return formattedMed;
                })
                .collect(Collectors.toList());
    }

    private String extractSpecificMedName(String q) {
        // Very lightweight heuristic: if query contains verbs and another token that is not an intent verb
        // Look for a token >3 chars that isn't one of the generic verbs; return lowercased.
        Set<String> generic = Set.of("medicament","médicament","medicine","medicines","medicin","drug","drugs","pill","pills","meds","supply","supplies","supplied","provide","provides","provided","have","has","having","possess","posess","possession","stock","stocked","stocking","carry","carries","carried","sell","sells","selling","offer","offers","offering","list","i","do","my","the","what","which");
        for (String token : q.replaceAll("[^a-zA-Z0-9 ]"," ").split(" ")) {
            String t = token.trim().toLowerCase();
            if (t.length() > 3 && !generic.contains(t)) {
                return t; // first candidate
            }
        }
        return null;
    }
}
