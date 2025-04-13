package com.example.gestion_pharmacie.entites;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class GroqChatRequest {
    private String model;
    private List<Map<String, String>> messages;

}
