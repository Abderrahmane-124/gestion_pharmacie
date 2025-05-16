package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.LigneCommandeDto;
import com.example.gestion_pharmacie.DTO.LigneCommandeResponseDto;
import com.example.gestion_pharmacie.Services.LigneCommandeService;
import com.example.gestion_pharmacie.entites.LigneCommande;
import com.example.gestion_pharmacie.entites.Commande;
import com.example.gestion_pharmacie.entites.Medicament;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LigneCommandeControllerTest {

    @Mock
    private LigneCommandeService ligneCommandeService;

    @InjectMocks
    private LigneCommandeController ligneCommandeController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(ligneCommandeController).build();
    }

    @Test
    void testCreateLigneCommande() throws Exception {
        // Arrange
        LigneCommandeDto ligneCommandeDto = new LigneCommandeDto();
        LigneCommande ligneCommande = createSampleLigneCommande();
        
        when(ligneCommandeService.createLigneCommande(eq(1L), any(LigneCommandeDto.class))).thenReturn(ligneCommande);

        // Act & Assert
        mockMvc.perform(post("/lignes-commande/commande/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ligneCommandeDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(ligneCommandeService, times(1)).createLigneCommande(eq(1L), any(LigneCommandeDto.class));
    }

    @Test
    void testUpdateLigneCommande() throws Exception {
        // Arrange
        LigneCommandeDto updateDto = new LigneCommandeDto();
        LigneCommande ligneCommande = createSampleLigneCommande();
        
        when(ligneCommandeService.updateLigneCommande(eq(1L), any(LigneCommandeDto.class))).thenReturn(ligneCommande);

        // Act & Assert
        mockMvc.perform(put("/lignes-commande/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(ligneCommandeService, times(1)).updateLigneCommande(eq(1L), any(LigneCommandeDto.class));
    }

    @Test
    void testDeleteLigneCommande() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/lignes-commande/1"))
                .andExpect(status().isNoContent());

        verify(ligneCommandeService, times(1)).deleteLigneCommande(1L);
    }

    @Test
    void testGetLignesCommandeByCommande() throws Exception {
        // Arrange
        List<LigneCommande> lignesCommande = Arrays.asList(
                createSampleLigneCommande(), 
                createSampleLigneCommande()
        );
        
        when(ligneCommandeService.getLignesCommandeByCommande(1L)).thenReturn(lignesCommande);

        // Act & Assert
        mockMvc.perform(get("/lignes-commande/commande/1"))
                .andExpect(status().isOk());

        verify(ligneCommandeService, times(1)).getLignesCommandeByCommande(1L);
    }

    @Test
    void testGetAllLigneCommandes() throws Exception {
        // Arrange
        List<LigneCommande> ligneCommandes = Arrays.asList(
                createSampleLigneCommande(), 
                createSampleLigneCommande()
        );
        
        when(ligneCommandeService.getAllLigneCommandes()).thenReturn(ligneCommandes);

        // Act & Assert
        mockMvc.perform(get("/lignes-commande/all"))
                .andExpect(status().isOk());

        verify(ligneCommandeService, times(1)).getAllLigneCommandes();
    }
    
    private LigneCommande createSampleLigneCommande() {
        LigneCommande ligneCommande = new LigneCommande();
        ligneCommande.setId(1L);
        ligneCommande.setQuantite(10);
        
        Commande commande = new Commande();
        commande.setId(1L);
        ligneCommande.setCommande(commande);
        
        Medicament medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Doliprane");
        medicament.setPrix_public(10);
        medicament.setPrix_hospitalier(8);
        medicament.setQuantite(100);
        ligneCommande.setMedicament(medicament);
        
        return ligneCommande;
    }
} 