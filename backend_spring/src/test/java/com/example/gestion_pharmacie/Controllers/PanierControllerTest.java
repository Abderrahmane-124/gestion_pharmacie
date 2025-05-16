package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.CreatePanierRequest;
import com.example.gestion_pharmacie.DTO.PanierResponseDto;
import com.example.gestion_pharmacie.Services.PanierService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

class PanierControllerTest {

    @Mock
    private PanierService panierService;

    @InjectMocks
    private PanierController panierController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(panierController).build();
    }

    @Test
    void testCreateAndSubmitPanier() throws Exception {
        // Arrange
        CreatePanierRequest request = new CreatePanierRequest();
        PanierResponseDto responseDto = createSamplePanierResponseDto();
        
        when(panierService.createAndSubmitPanier(any(CreatePanierRequest.class))).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(post("/api/paniers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));

        verify(panierService, times(1)).createAndSubmitPanier(any(CreatePanierRequest.class));
    }

    @Test
    void testGetAllPaniers() throws Exception {
        // Arrange
        List<PanierResponseDto> paniers = Arrays.asList(
            createSamplePanierResponseDto(),
            createSamplePanierResponseDto()
        );
        
        when(panierService.getPaniersForCurrentPharmacien()).thenReturn(paniers);

        // Act & Assert
        mockMvc.perform(get("/api/paniers"))
                .andExpect(status().isOk());

        verify(panierService, times(1)).getPaniersForCurrentPharmacien();
    }

    @Test
    void testCloseCurrentPanier() throws Exception {
        // Arrange
        PanierResponseDto responseDto = createSamplePanierResponseDto();
        
        when(panierService.closeCurrentPanier()).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(post("/api/paniers/close"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(panierService, times(1)).closeCurrentPanier();
    }
    
    private PanierResponseDto createSamplePanierResponseDto() {
        PanierResponseDto dto = new PanierResponseDto();
        dto.setId(1L);
        dto.setDateCreation(LocalDateTime.now());
        
        // Create sample ligne panier items
        List<PanierResponseDto.LignePanierDto> lignesPanier = new ArrayList<>();
        PanierResponseDto.LignePanierDto ligneDto = new PanierResponseDto.LignePanierDto();
        ligneDto.setId(1L);
        ligneDto.setQuantite(5);
        
        PanierResponseDto.MedicamentDto medicamentDto = new PanierResponseDto.MedicamentDto();
        medicamentDto.setId(1L);
        medicamentDto.setNom("Doliprane");
        medicamentDto.setPrix_hospitalier(10.0f);
        medicamentDto.setPrix_public(15.0f);
        medicamentDto.setQuantite(100);
        ligneDto.setMedicament(medicamentDto);
        
        lignesPanier.add(ligneDto);
        dto.setLignesPanier(lignesPanier);
        
        return dto;
    }
}