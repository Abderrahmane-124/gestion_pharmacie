package com.example.gestion_pharmacie.Security;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    private String secretKey = "secret"; // Clé secrète pour signer les tokens

    // Méthode pour générer le JWT
    public String generateJwtToken(String username) {
        return Jwts.builder()
                .setSubject(username) // Le sujet du token (souvent le nom d'utilisateur)
                .setIssuedAt(new Date()) // La date de création
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // Expiration dans 1 jour
                .signWith(SignatureAlgorithm.HS256, secretKey) // Signature avec la clé secrète
                .compact();
    }

    // Méthode pour extraire le nom d'utilisateur du token
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey) // Utiliser la même clé secrète
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Méthode pour valider le token
    public boolean validateJwtToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
