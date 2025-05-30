package com.example.gestion_pharmacie.Controllers;


import com.example.gestion_pharmacie.Services.UtilisateurService;
import com.example.gestion_pharmacie.entites.Fournisseur;
import com.example.gestion_pharmacie.entites.Pharmacien;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {
    private final UtilisateurService utilisateurService;

    @Autowired
    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

//    @PostMapping("/pharmaciens")
//    public ResponseEntity<Pharmacien> creerPharmacien(@RequestBody Pharmacien pharmacien) {
//        Pharmacien nouveauPharmacien = utilisateurService.creerPharmacien(pharmacien);
//        return new ResponseEntity<>(nouveauPharmacien, HttpStatus.CREATED);
//    }
//
//    @PostMapping("/fournisseurs")
//    public ResponseEntity<Fournisseur> creerFournisseur(@RequestBody Fournisseur fournisseur) {
//        Fournisseur nouveauFournisseur = utilisateurService.creerFournisseur(fournisseur);
//        return new ResponseEntity<>(nouveauFournisseur, HttpStatus.CREATED);
//    }

    @GetMapping("/pharmaciens")
    public ResponseEntity<List<Pharmacien>> getAllPharmaciens() {
        List<Pharmacien> pharmaciens = utilisateurService.getAllPharmaciens();
        return new ResponseEntity<>(pharmaciens, HttpStatus.OK);
    }

    @GetMapping("/fournisseurs")
    public ResponseEntity<List<Fournisseur>> getAllFournisseurs() {
        List<Fournisseur> fournisseurs = utilisateurService.getAllFournisseurs();
        return new ResponseEntity<>(fournisseurs, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUsers() {
        List<Utilisateur> utilisateurs = utilisateurService.getAllUsers();
        return new ResponseEntity<>(utilisateurs, HttpStatus.OK);
    }

    @GetMapping("/current")
    public ResponseEntity<Utilisateur> getCurrentUser() {
        try {
            Utilisateur currentUser = utilisateurService.getCurrentUser();
            return new ResponseEntity<>(currentUser, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUtilisateur(@PathVariable Long id) {
        try {
            utilisateurService.deleteUtilisateur(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
