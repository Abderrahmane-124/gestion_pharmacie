package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.DTO.AuthRequest;
import com.example.gestion_pharmacie.DTO.AuthResponse;
import com.example.gestion_pharmacie.DTO.LoginUserDto;
import com.example.gestion_pharmacie.DTO.RegisterUserDto;
import com.example.gestion_pharmacie.Repositorys.UtilisateurRepository;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Role;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {
    private final UtilisateurRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;


    public AuthenticationService(
            UtilisateurRepository userRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder, JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Register a new user (Pharmacien or Fournisseur)
    public AuthResponse register(RegisterUserDto dto) {
        if (dto.getRole() == null) {
            throw new IllegalArgumentException("Le rôle est obligatoire.");
        }


        // Check if email already exists
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Cet email est déjà utilisé.");
        }

        Utilisateur utilisateur;
        switch (dto.getRole()) {
            case PHARMACIEN:
                utilisateur = new Pharmacien();
                break;
            case FOURNISSEUR:
                Fournisseur fournisseur = new Fournisseur();
                fournisseur.setTelephone(dto.getTelephone());
                utilisateur = fournisseur;
                break;
            default:
                throw new IllegalArgumentException("Rôle non valide");
        }

        utilisateur.setNom(dto.getNom());
        utilisateur.setPrenom(dto.getPrenom());
        utilisateur.setEmail(dto.getEmail());
        utilisateur.setVille(dto.getVille());
        utilisateur.setAdresse(dto.getAdresse());
        utilisateur.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));

        userRepository.save(utilisateur);

        // Generate JWT token
        String token = jwtService.generateToken(utilisateur);

        return new AuthResponse(token);
    }


    // Authenticate a user and return a JWT
    public AuthResponse authenticate(AuthRequest authRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getMotDePasse())
        );

        Utilisateur utilisateur = userRepository.findByEmail(authRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        // Generate a JWT token
        String token = jwtService.generateToken(utilisateur);

        return new AuthResponse(token);
    }



}