package com.example.gestion_pharmacie.rag;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public class RagResponse {
    @JsonProperty("response")
    private String response;

    @JsonProperty("context_used")
    private List<String> contextUsed;

    @JsonProperty("sources")
    private List<Map<String, Object>> sources;

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public List<String> getContextUsed() {
        return contextUsed;
    }

    public void setContextUsed(List<String> contextUsed) {
        this.contextUsed = contextUsed;
    }

    public List<Map<String, Object>> getSources() {
        return sources;
    }

    public void setSources(List<Map<String, Object>> sources) {
        this.sources = sources;
    }
}

