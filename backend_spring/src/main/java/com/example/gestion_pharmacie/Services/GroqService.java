package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.entites.GroqChatRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;


@Service
public class GroqService {
    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getChatResponse(String userMessage) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> systemMessage = Map.of("role", "system", "content", "You are a helpful assistant.");
        Map<String, String> userMsg = Map.of("role", "user", "content", userMessage);

        GroqChatRequest request = new GroqChatRequest();
        request.setModel("deepseek-r1-distill-qwen-32b");
        request.setMessages(List.of(systemMessage, userMsg));

        HttpEntity<GroqChatRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);
        System.out.println("Groq raw response: " + response);
        System.out.println("Body: " + response.getBody());
        if (response.getStatusCode().isError()) {
            throw new RuntimeException("Failed to get response from Groq API: " + response.getStatusCode());
        }

        // Extract message from response JSON
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");

        return (String) message.get("content");
    }
}
