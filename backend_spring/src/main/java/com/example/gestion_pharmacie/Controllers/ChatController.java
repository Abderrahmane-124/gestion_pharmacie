package com.example.gestion_pharmacie.Controllers;


import com.example.gestion_pharmacie.Services.GroqService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final GroqService groqService;

    public ChatController(GroqService groqService) {
        this.groqService = groqService;
    }

    @PostMapping
    public String chat(@RequestBody Map<String, String> payload) {
        String userMessage = payload.get("message");
        return groqService.getChatResponse(userMessage);
    }
}
