package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.AuthRequest;
import com.example.gestion_pharmacie.DTO.AuthResponse;
import com.example.gestion_pharmacie.DTO.RegisterUserDto;
import com.example.gestion_pharmacie.Services.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterUserDto dto) {
        return ResponseEntity.ok(authenticationService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authenticationService.authenticate(authRequest));
    }
}