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
import java.util.stream.Collectors;

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

        // Build curated context (always plain strings)
        Map<String, Object> raw = curatedContextService.getRelevantData(prompt);
        List<String> context = new ArrayList<>();

        if (raw.containsKey("role")) {
            context.add("Role: " + raw.get("role"));
        }
        if (raw.containsKey("medicaments")) {
            Object medsObj = raw.get("medicaments");
            if (medsObj instanceof List<?>) {
                @SuppressWarnings("unchecked") List<Map<String,String>> meds = (List<Map<String,String>>) medsObj;
                // Summarize each medicament to single line: nom + first indication bullet
                List<String> summarized = meds.stream().map(m -> {
                    String name = m.getOrDefault("nom", "?").replaceAll("<[^>]+>", "").trim();
                    String indications = m.getOrDefault("indications", "").replace("\n", " ").trim();
                    if (indications.startsWith("•")) indications = indications.substring(1).trim();
                    String first = indications.length() > 80 ? indications.substring(0, 80) + "..." : indications;
                    return "Medicament: " + name + (first.isBlank() ? "" : " | " + first);
                }).collect(Collectors.toList());
                context.addAll(summarized);
            }
        }
        if (raw.containsKey("commandes")) {
            context.add("Commandes count: " + ((List<?>) raw.get("commandes")).size());
        }
        if (raw.containsKey("fournisseurs")) {
            context.add("Fournisseurs count: " + ((List<?>) raw.get("fournisseurs")).size());
        }
        if (raw.containsKey("pharmaciens")) {
            context.add("Pharmaciens count: " + ((List<?>) raw.get("pharmaciens")).size());
        }
        if (raw.containsKey("alertes")) {
            context.add("Alertes count: " + ((List<?>) raw.get("alertes")).size());
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
