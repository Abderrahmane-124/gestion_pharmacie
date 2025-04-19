package com.example.gestion_pharmacie.DTO;


import com.example.gestion_pharmacie.entites.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class userDTO {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private Role role;
}
