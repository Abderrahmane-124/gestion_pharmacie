package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.entites.GroqChatRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Service
public class GroqService {
    private static final Logger logger = LoggerFactory.getLogger(GroqService.class);
    
    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final DatabaseQueryService databaseQueryService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public GroqService(DatabaseQueryService databaseQueryService) {
        this.databaseQueryService = databaseQueryService;
    }

    public String getChatResponse(String userMessage) {
        logger.info("Received chat request with message: {}", userMessage);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        logger.info("Using API URL: {}", apiUrl);

        // Retrieve relevant database information based on the user's query
        Map<String, Object> databaseData = databaseQueryService.getRelevantData(userMessage);
        logger.info("Retrieved database data: {}", databaseData);
        
        // Create enhanced system message with database context
        String systemPrompt = "You are a helpful pharmacy management assistant. " +
                "You have access to the pharmacy database. " +
                "Answer questions based on the following data: " + 
                formatDatabaseData(databaseData);
        
        Map<String, String> systemMessage = Map.of("role", "system", "content", systemPrompt);
        Map<String, String> userMsg = Map.of("role", "user", "content", userMessage);

        GroqChatRequest request = new GroqChatRequest();
        request.setModel("meta-llama/llama-4-scout-17b-16e-instruct");
        request.setMessages(List.of(systemMessage, userMsg));

        try {
            logger.info("Sending request to Groq API: {}", objectMapper.writeValueAsString(request));
            HttpEntity<GroqChatRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);
            
            logger.info("Groq API response status: {}", response.getStatusCode());
            logger.info("Groq API response body: {}", response.getBody());
            
            if (response.getStatusCode().isError()) {
                String errorMessage = "Failed to get response from Groq API: " + response.getStatusCode();
                logger.error(errorMessage);
                throw new RuntimeException(errorMessage);
            }

            if (response.getBody() == null) {
                String errorMessage = "Received null response body from Groq API";
                logger.error(errorMessage);
                throw new RuntimeException(errorMessage);
            }

            // Extract message from response JSON
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            if (choices == null || choices.isEmpty()) {
                String errorMessage = "No choices found in Groq API response";
                logger.error(errorMessage);
                throw new RuntimeException(errorMessage);
            }

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message == null) {
                String errorMessage = "No message found in first choice";
                logger.error(errorMessage);
                throw new RuntimeException(errorMessage);
            }

            String content = (String) message.get("content");
            if (content == null) {
                String errorMessage = "No content found in message";
                logger.error(errorMessage);
                throw new RuntimeException(errorMessage);
            }

            logger.info("Successfully extracted response content: {}", content);
            return content;
            
        } catch (Exception e) {
            logger.error("Error processing Groq API request", e);
            throw new RuntimeException("Error processing chat request: " + e.getMessage(), e);
        }
    }
    
    private String formatDatabaseData(Map<String, Object> data) {
        try {
            // Convert the data to a simplified and limited JSON string representation
            // We'll limit the data to prevent overwhelming the model
            StringBuilder formattedData = new StringBuilder();
            
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                formattedData.append(entry.getKey()).append(": ");
                
                if (entry.getValue() instanceof List && !((List<?>) entry.getValue()).isEmpty()) {
                    List<?> items = (List<?>) entry.getValue();
                    // Limit to first 5 items to avoid token overflow
                    int limit = Math.min(5, items.size());
                    formattedData.append(objectMapper.writeValueAsString(items.subList(0, limit)));
                    
                    if (items.size() > limit) {
                        formattedData.append(" (showing first ").append(limit)
                                .append(" of ").append(items.size()).append(" items)");
                    }
                } else {
                    formattedData.append(objectMapper.writeValueAsString(entry.getValue()));
                }
                
                formattedData.append("\n\n");
            }
            
            return formattedData.toString();
        } catch (Exception e) {
            logger.error("Error formatting database data", e);
            return "Error formatting database data: " + e.getMessage();
        }
    }
}
