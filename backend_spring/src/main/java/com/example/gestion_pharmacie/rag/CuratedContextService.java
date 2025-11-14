package com.example.gestion_pharmacie.rag;

import com.example.gestion_pharmacie.Services.DatabaseQueryService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CuratedContextService {

    private static final int MAX_MED_ITEMS = 25;
    private static final int MAX_LINE_CHARS = 140;

    private final DatabaseQueryService databaseQueryService;

    public CuratedContextService(DatabaseQueryService databaseQueryService) {
        this.databaseQueryService = databaseQueryService;
    }

    public List<String> buildContext(String userQuery) {
        Map<String, Object> data = databaseQueryService.getRelevantData(userQuery);
        List<String> chunks = new ArrayList<>();

        // Role
        Object role = data.get("role");
        if (role != null) {
            chunks.add("Role: " + role);
        }

        // Medicaments summarization (skip header if empty)
        Object medsObj = data.get("medicaments");
        if (medsObj instanceof List<?>) {
            @SuppressWarnings("unchecked") List<Map<String, String>> meds = (List<Map<String, String>>) medsObj;
            if (!meds.isEmpty()) {
                List<String> lines = meds.stream()
                        .limit(MAX_MED_ITEMS)
                        .map(this::summarizeMed)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                chunks.addAll(lines);
            }
        }

        // Counts
        addCountChunk(chunks, data, "commandes", "Commandes count");
        addCountChunk(chunks, data, "fournisseurs", "Fournisseurs count");
        addCountChunk(chunks, data, "pharmaciens", "Pharmaciens count");
        addCountChunk(chunks, data, "alertes", "Alertes count");

        // Stats
        Object stats = data.get("stats");
        if (stats != null) {
            chunks.add("Stats: " + stats.toString());
        }

        return chunks;
    }

    private void addCountChunk(List<String> chunks, Map<String, Object> data, String key, String label) {
        Object obj = data.get(key);
        if (obj instanceof List<?>) {
            chunks.add(label + ": " + ((List<?>) obj).size());
        }
    }

    private String summarizeMed(Map<String, String> med) {
        if (med == null) return null;
        String name = clean(med.get("nom"));
        String indications = clean(med.get("indications"));
        if (indications.startsWith("•")) indications = indications.substring(1).trim();
        if (indications.length() > MAX_LINE_CHARS) indications = indications.substring(0, MAX_LINE_CHARS) + "...";
        return "Medicament: " + name + (indications.isBlank() ? "" : " | " + indications);
    }

    private String clean(String s) {
        if (s == null) return "";
        return s.replaceAll("<[^>]+>", "").replace('\n', ' ').trim();
    }
}
