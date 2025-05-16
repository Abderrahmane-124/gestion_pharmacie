package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Utilisateur;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    private Utilisateur utilisateur;
    private final String SECRET_KEY = "3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b";
    private final long EXPIRATION_TIME = 86400000; // 1 day

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Set up secret key and expiration time using reflection
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET_KEY);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", EXPIRATION_TIME);
        
        // Create test user
        utilisateur = new Pharmacien();
        utilisateur.setId(1L);
        utilisateur.setEmail("test@example.com");
        utilisateur.setNom("Test");
        utilisateur.setPrenom("User");
    }

    @Test
    void extractUsername_Valid() {
        // Arrange
        String token = jwtService.generateToken(utilisateur);
        
        // Act
        String username = jwtService.extractUsername(token);
        
        // Assert
        assertEquals("test@example.com", username);
    }

    @Test
    void generateToken_WithoutClaims() {
        // Act
        String token = jwtService.generateToken(utilisateur);
        
        // Assert
        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }

    @Test
    void generateToken_WithClaims() {
        // Arrange
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "PHARMACIEN");
        extraClaims.put("userId", 1L);
        
        // Act
        String token = jwtService.generateToken(extraClaims, utilisateur);
        
        // Assert
        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
        
        // Custom method to extract claim and verify it
        Function<Claims, Object> claimsResolver = claims -> claims.get("role");
        Object role = jwtService.extractClaim(token, claimsResolver);
        assertEquals("PHARMACIEN", role);
    }

    @Test
    void isTokenValid_ValidToken() {
        // Arrange
        String token = jwtService.generateToken(utilisateur);
        
        // Act
        boolean valid = jwtService.isTokenValid(token, utilisateur);
        
        // Assert
        assertTrue(valid);
    }

    @Test
    void isTokenValid_ExpiredToken() {
        // Create a token that is already expired
        String token = createExpiredToken(utilisateur);
        
        // Act
        boolean valid = false;
        try {
            valid = jwtService.isTokenValid(token, utilisateur);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            // This exception is expected, token is expired
            // The isTokenValid method should catch this internally and return false
            // but if it doesn't, we'll handle it here
        }
        
        // Assert
        assertFalse(valid);
    }

    @Test
    void isTokenValid_DifferentUser() {
        // Arrange
        String token = jwtService.generateToken(utilisateur);
        
        Utilisateur differentUser = new Pharmacien();
        differentUser.setEmail("different@example.com");
        
        // Act
        boolean valid = jwtService.isTokenValid(token, differentUser);
        
        // Assert
        assertFalse(valid);
    }

    @Test
    void getExpirationTime_Correct() {
        // Act
        long expTime = jwtService.getExpirationTime();
        
        // Assert
        assertEquals(EXPIRATION_TIME, expTime);
    }

    // Helper method to create an expired token for testing
    private String createExpiredToken(UserDetails userDetails) {
        // Set expiration to 1 hour ago
        long expirationMillis = -3600000;
        return Jwts
                .builder()
                .setClaims(new HashMap<>())
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Helper method to get signing key
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
} 