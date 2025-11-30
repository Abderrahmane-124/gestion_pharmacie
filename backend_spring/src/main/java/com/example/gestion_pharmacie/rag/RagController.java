package com.example.gestion_pharmacie.rag;

import com.example.gestion_pharmacie.Services.DatabaseQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private static final Logger log = LoggerFactory.getLogger(RagController.class);
    private final RagClient ragClient;
    private final DatabaseQueryService curatedContextService;

    public RagController(RagClient ragClient, DatabaseQueryService curatedContextService) {
        this.ragClient = ragClient;
        this.curatedContextService = curatedContextService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequestDto payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String prompt = payload.getMessage();
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message cannot be empty");
        }

        // Build curated context from database-relevant data
        Map<String, Object> raw = curatedContextService.getRelevantData(prompt);
        List<String> context = new ArrayList<>();

        if (raw.containsKey("role")) {
            context.add("Role: " + raw.get("role"));
        }
        if (raw.containsKey("medicaments")) {
            Object medsObj = raw.get("medicaments");
            if (medsObj instanceof List<?>) {
                @SuppressWarnings("unchecked") List<Map<String,String>> meds = (List<Map<String,String>>) medsObj;
                // Summarize each medicament to include quantity and key attributes so the AI can filter on stock
                List<String> summarized = meds.stream().map(m -> {
                    String name = m.getOrDefault("nom", "?").replaceAll("<[^>]+>", "").trim();
                    String quantite = m.getOrDefault("quantite", "?");
                    String codeAtc = m.getOrDefault("code_ATC", "");
                    String presentation = m.getOrDefault("presentation", "");
                    String classe = m.getOrDefault("classe_therapeutique", "");
                    String indications = m.getOrDefault("indications", "").replace("\n", " ").trim();
                    if (indications.startsWith("•")) indications = indications.substring(1).trim();
                    if (indications.length() > 80) {
                        indications = indications.substring(0, 80) + "...";
                    }
                    StringBuilder sb = new StringBuilder();
                    sb.append("Medicament: ").append(name);
                    sb.append(" | Quantite en stock: ").append(quantite);
                    if (!codeAtc.isBlank()) sb.append(" | Code ATC: ").append(codeAtc);
                    if (!presentation.isBlank()) sb.append(" | Presentation: ").append(presentation);
                    if (!classe.isBlank()) sb.append(" | Classe therapeutique: ").append(classe);
                    if (!indications.isBlank()) sb.append(" | Indications: ").append(indications);
                    return sb.toString();
                }).toList();
                context.addAll(summarized);
            }
        }
        if (raw.containsKey("commandes")) {
            Object commandesObj = raw.get("commandes");
            if (commandesObj instanceof List<?>) {
                for (Object o : (List<?>) commandesObj) {
                    if (o instanceof com.example.gestion_pharmacie.entites.Commande c) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("Commande: ").append(c.getId());
                        if (c.getDateCommande() != null) sb.append(" | Date: ").append(c.getDateCommande());
                        if (c.getStatut() != null) sb.append(" | Statut: ").append(c.getStatut());
                        if (c.getPharmacien() != null) sb.append(" | Pharmacien: ").append(c.getPharmacien().getId());
                        if (c.getFournisseur() != null) sb.append(" | Fournisseur: ").append(c.getFournisseur().getId());
                        // Add detailed lignes commande (nom + quantite)
                        if (c.getLignesCommande() != null && !c.getLignesCommande().isEmpty()) {
                            int idx = 1;
                            for (com.example.gestion_pharmacie.entites.LigneCommande lc : c.getLignesCommande()) {
                                sb.append(" | Ligne ").append(idx++).append(": ");
                                if (lc.getMedicament() != null) {
                                    sb.append(lc.getMedicament().getNom());
                                }
                                if (lc.getQuantite() != null) {
                                    sb.append(" x").append(lc.getQuantite());
                                }
                            }
                        }
                        context.add(sb.toString());
                    }
                }
            }
        }
        if (raw.containsKey("alertes")) {
            Object alertesObj = raw.get("alertes");
            if (alertesObj instanceof List<?>) {
                for (Object o : (List<?>) alertesObj) {
                    if (o instanceof com.example.gestion_pharmacie.entites.Alerte a) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("Alerte: ").append(a.getId());
                        if (a.getMessage() != null) sb.append(" | Message: ").append(a.getMessage());
                        if (a.getDateCreation() != null) sb.append(" | Date: ").append(a.getDateCreation());
                        sb.append(" | Min quantite: ").append(a.getMinimumQuantite());
                        if (a.getMedicaments() != null) sb.append(" | Medicaments: ").append(a.getMedicaments().size());
                        context.add(sb.toString());
                    }
                }
            }
        }
        if (raw.containsKey("paniers")) {
            Object paniersObj = raw.get("paniers");
            if (paniersObj instanceof List<?>) {
                for (Object o : (List<?>) paniersObj) {
                    if (o instanceof com.example.gestion_pharmacie.entites.Panier p) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("Panier: ").append(p.getId());
                        if (p.getDateCreation() != null) sb.append(" | Date: ").append(p.getDateCreation());
                        sb.append(" | Vendu: ").append(p.isVendu());
                        // Add detailed lignes panier (nom + quantite)
                        if (p.getLignesPanier() != null && !p.getLignesPanier().isEmpty()) {
                            int idx = 1;
                            for (com.example.gestion_pharmacie.entites.LignePanier lp : p.getLignesPanier()) {
                                sb.append(" | LignePanier ").append(idx++).append(": ");
                                if (lp.getMedicament() != null) {
                                    sb.append(lp.getMedicament().getNom());
                                }
                                if (lp.getQuantite() != null) {
                                    sb.append(" x").append(lp.getQuantite());
                                }
                            }
                        }
                        context.add(sb.toString());
                    }
                }
            }
        }
        if (raw.containsKey("fournisseurs")) {
            context.add("Fournisseurs count: " + ((List<?>) raw.get("fournisseurs")).size());
        }
        if (raw.containsKey("pharmaciens")) {
            context.add("Pharmaciens count: " + ((List<?>) raw.get("pharmaciens")).size());
        }
        if (raw.containsKey("stats")) {
            context.add("Stats: " + raw.get("stats").toString());
        }

        log.info("[RAG] Curated context items built: {}", context.size());

        Integer maxNew = payload.getMax_new_tokens();
        Double temperature = payload.getTemperature();
        Double topP = payload.getTop_p();

        try {
            RagResponse result = ragClient.chatWithRag(prompt, context, maxNew, temperature, topP);
            return ResponseEntity.ok(result);
        } catch (RestClientException ex) {
            log.error("RAG service call failed", ex);
            return ResponseEntity.status(502).body("RAG service unavailable");
        }
    }
}
