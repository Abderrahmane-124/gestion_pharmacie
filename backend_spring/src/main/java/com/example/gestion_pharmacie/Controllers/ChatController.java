package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.Services.GroqService;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ChatController {
    private final GroqService groqService;
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    public ChatController(GroqService groqService) {
        this.groqService = groqService;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, String> payload) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            logger.info("User authenticated: {}", auth != null ? auth.getName() : "anonymous");
            
            if (auth == null || !auth.isAuthenticated()) {
                logger.warn("Unauthorized access attempt");
                return ResponseEntity.status(401).body("Unauthorized");
            }

            String userMessage = payload.get("message");
            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Message cannot be empty");
            }

            String response = groqService.getChatResponse(userMessage);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error processing chat request", e);
            return ResponseEntity.status(500).body("Internal server error");
        }
    }
}
