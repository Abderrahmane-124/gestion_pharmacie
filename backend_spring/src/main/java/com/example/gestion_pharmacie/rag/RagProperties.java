package com.example.gestion_pharmacie.rag;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RagProperties {

    @Value("${rag.base-url:http://localhost:8000}")
    private String baseUrl;

    @Value("${rag.service-token:}")
    private String serviceToken; // optional service-to-service auth

    @Value("${rag.context.max-items:10}")
    private int contextMaxItems;

    @Value("${rag.context.max-chars-per-item:1200}")
    private int contextMaxCharsPerItem;

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getServiceToken() {
        return serviceToken;
    }

    public int getContextMaxItems() {
        return contextMaxItems;
    }

    public int getContextMaxCharsPerItem() {
        return contextMaxCharsPerItem;
    }
}
