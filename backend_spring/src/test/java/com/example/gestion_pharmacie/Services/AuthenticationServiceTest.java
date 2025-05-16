package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.AuthRequest;
import com.example.gestion_pharmacie.DTO.AuthResponse;
import com.example.gestion_pharmacie.DTO.RegisterUserDto;
import com.example.gestion_pharmacie.Repositorys.UtilisateurRepository;
import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Role;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthenticationServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Setup mock behavior
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(jwtService.generateToken(any(Utilisateur.class))).thenReturn("test_token");
    }

    @Test
    void register_PharmacienSuccess() {
        // Arrange
        RegisterUserDto registerDto = new RegisterUserDto();
        registerDto.setNom("Test");
        registerDto.setPrenom("User");
        registerDto.setEmail("test@example.com");
        registerDto.setMotDePasse("password");
        registerDto.setRole(Role.PHARMACIEN);
        registerDto.setVille("Test City");
        registerDto.setAdresse("Test Address");
        
        when(utilisateurRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        
        // Act
        AuthResponse response = authenticationService.register(registerDto);

        // Assert
        assertNotNull(response);
        assertEquals("test_token", response.getToken());
        
        verify(utilisateurRepository, times(1)).findByEmail("test@example.com");
        verify(passwordEncoder, times(1)).encode("password");
        verify(utilisateurRepository, times(1)).save(any(Pharmacien.class));
        verify(jwtService, times(1)).generateToken(any(Utilisateur.class));
    }

    @Test
    void register_FournisseurSuccess() {
        // Arrange
        RegisterUserDto registerDto = new RegisterUserDto();
        registerDto.setNom("Test");
        registerDto.setPrenom("Supplier");
        registerDto.setEmail("supplier@example.com");
        registerDto.setMotDePasse("password");
        registerDto.setRole(Role.FOURNISSEUR);
        registerDto.setVille("Test City");
        registerDto.setAdresse("Test Address");
        registerDto.setTelephone("1234567890");
        
        when(utilisateurRepository.findByEmail("supplier@example.com")).thenReturn(Optional.empty());
        
        // Act
        AuthResponse response = authenticationService.register(registerDto);

        // Assert
        assertNotNull(response);
        assertEquals("test_token", response.getToken());
        
        verify(utilisateurRepository, times(1)).findByEmail("supplier@example.com");
        verify(passwordEncoder, times(1)).encode("password");
        verify(utilisateurRepository, times(1)).save(any(Fournisseur.class));
        verify(jwtService, times(1)).generateToken(any(Utilisateur.class));
    }

    @Test
    void register_EmailAlreadyExists() {
        // Arrange
        RegisterUserDto registerDto = new RegisterUserDto();
        registerDto.setEmail("existing@example.com");
        registerDto.setRole(Role.PHARMACIEN);
        
        Utilisateur existingUser = new Pharmacien();
        existingUser.setEmail("existing@example.com");
        
        when(utilisateurRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        
        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            authenticationService.register(registerDto);
        });
        
        assertTrue(exception.getMessage().contains("déjà utilisé"));
        verify(utilisateurRepository, times(1)).findByEmail("existing@example.com");
        verify(utilisateurRepository, never()).save(any(Utilisateur.class));
    }

    @Test
    void register_NoRoleProvided() {
        // Arrange
        RegisterUserDto registerDto = new RegisterUserDto();
        registerDto.setEmail("test@example.com");
        
        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            authenticationService.register(registerDto);
        });
        
        assertTrue(exception.getMessage().contains("rôle est obligatoire"));
        verify(utilisateurRepository, never()).save(any(Utilisateur.class));
    }

    @Test
    void authenticate_Success() {
        // Arrange
        AuthRequest authRequest = new AuthRequest();
        authRequest.setEmail("user@example.com");
        authRequest.setMotDePasse("password");
        
        Utilisateur utilisateur = new Pharmacien();
        utilisateur.setEmail("user@example.com");
        
        when(utilisateurRepository.findByEmail("user@example.com")).thenReturn(Optional.of(utilisateur));
        
        // Act
        AuthResponse response = authenticationService.authenticate(authRequest);

        // Assert
        assertNotNull(response);
        assertEquals("test_token", response.getToken());
        
        verify(authenticationManager, times(1)).authenticate(
                any(UsernamePasswordAuthenticationToken.class));
        verify(utilisateurRepository, times(1)).findByEmail("user@example.com");
        verify(jwtService, times(1)).generateToken(utilisateur);
    }

    @Test
    void authenticate_UserNotFound() {
        // Arrange
        AuthRequest authRequest = new AuthRequest();
        authRequest.setEmail("nonexistent@example.com");
        authRequest.setMotDePasse("password");
        
        when(utilisateurRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        
        // Act & Assert
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            authenticationService.authenticate(authRequest);
        });
        
        assertTrue(exception.getMessage().contains("Utilisateur non trouvé"));
    }
} 