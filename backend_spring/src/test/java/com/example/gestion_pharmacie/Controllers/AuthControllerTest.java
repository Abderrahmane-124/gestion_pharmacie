package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.AuthRequest;
import com.example.gestion_pharmacie.DTO.AuthResponse;
import com.example.gestion_pharmacie.DTO.RegisterUserDto;
import com.example.gestion_pharmacie.Services.AuthenticationService;
import com.example.gestion_pharmacie.entites.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegister() {
        // Arrange
        RegisterUserDto registerUserDto = new RegisterUserDto();
        registerUserDto.setNom("Doe");
        registerUserDto.setPrenom("John");
        registerUserDto.setEmail("john.doe@example.com");
        registerUserDto.setMotDePasse("password123");
        registerUserDto.setVille("Casablanca");
        registerUserDto.setAdresse("123 Main St");
        registerUserDto.setRole(Role.PHARMACIEN);

        AuthResponse expectedResponse = new AuthResponse("jwt-token-example");
        when(authenticationService.register(any(RegisterUserDto.class))).thenReturn(expectedResponse);

        // Act
        ResponseEntity<AuthResponse> responseEntity = authController.register(registerUserDto);

        // Assert
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals(expectedResponse.getToken(), responseEntity.getBody().getToken());
    }

    @Test
    void testLogin() {
        // Arrange
        AuthRequest authRequest = new AuthRequest();
        authRequest.setEmail("john.doe@example.com");
        authRequest.setMotDePasse("password123");

        AuthResponse expectedResponse = new AuthResponse("jwt-token-example");
        when(authenticationService.authenticate(any(AuthRequest.class))).thenReturn(expectedResponse);

        // Act
        ResponseEntity<AuthResponse> responseEntity = authController.login(authRequest);

        // Assert
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals(expectedResponse.getToken(), responseEntity.getBody().getToken());
    }

    @Test
    void testRegisterFournisseur() {
        // Arrange
        RegisterUserDto registerUserDto = new RegisterUserDto();
        registerUserDto.setNom("Smith");
        registerUserDto.setPrenom("Jane");
        registerUserDto.setEmail("jane.smith@example.com");
        registerUserDto.setMotDePasse("password456");
        registerUserDto.setVille("Rabat");
        registerUserDto.setAdresse("456 Second St");
        registerUserDto.setRole(Role.FOURNISSEUR);
        registerUserDto.setTelephone("+212600000000");

        AuthResponse expectedResponse = new AuthResponse("jwt-token-fournisseur");
        when(authenticationService.register(any(RegisterUserDto.class))).thenReturn(expectedResponse);

        // Act
        ResponseEntity<AuthResponse> responseEntity = authController.register(registerUserDto);

        // Assert
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals(expectedResponse.getToken(), responseEntity.getBody().getToken());
    }
} 