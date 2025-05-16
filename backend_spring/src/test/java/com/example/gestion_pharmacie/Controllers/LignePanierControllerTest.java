package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.LignePanierCreateRequest;
import com.example.gestion_pharmacie.DTO.LignePanierResponseDto;
import com.example.gestion_pharmacie.DTO.LignePanierUpdateRequest;
import com.example.gestion_pharmacie.Services.LignePanierService;
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

class LignePanierControllerTest {

    @Mock
    private LignePanierService lignePanierService;

    @InjectMocks
    private LignePanierController lignePanierController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(lignePanierController).build();
    }

    @Test
    void testAddLignePanier() throws Exception {
        // Arrange
        LignePanierCreateRequest request = new LignePanierCreateRequest();
        LignePanierResponseDto responseDto = createSampleLignePanierResponseDto();
        
        when(lignePanierService.addLignePanier(any(LignePanierCreateRequest.class))).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(post("/api/lignepaniers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));

        verify(lignePanierService, times(1)).addLignePanier(any(LignePanierCreateRequest.class));
    }

    @Test
    void testGetLignesPanier() throws Exception {
        // Arrange
        List<LignePanierResponseDto> lignes = Arrays.asList(
            createSampleLignePanierResponseDto(),
            createSampleLignePanierResponseDto()
        );
        
        when(lignePanierService.getLignesPanierForCurrentUser()).thenReturn(lignes);

        // Act & Assert
        mockMvc.perform(get("/api/lignepaniers"))
                .andExpect(status().isOk());

        verify(lignePanierService, times(1)).getLignesPanierForCurrentUser();
    }

    @Test
    void testUpdateLignePanier() throws Exception {
        // Arrange
        LignePanierUpdateRequest request = new LignePanierUpdateRequest();
        LignePanierResponseDto responseDto = createSampleLignePanierResponseDto();
        
        when(lignePanierService.updateLignePanier(eq(1L), any(LignePanierUpdateRequest.class))).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(put("/api/lignepaniers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(lignePanierService, times(1)).updateLignePanier(eq(1L), any(LignePanierUpdateRequest.class));
    }

    @Test
    void testDeleteLignePanier() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/lignepaniers/1"))
                .andExpect(status().isNoContent());

        verify(lignePanierService, times(1)).deleteLignePanier(1L);
    }
    
    private LignePanierResponseDto createSampleLignePanierResponseDto() {
        LignePanierResponseDto dto = new LignePanierResponseDto();
        dto.setId(1L);
        dto.setPanierId(1L);
        dto.setQuantite(5);
        
        LignePanierResponseDto.MedicamentDto medicamentDto = new LignePanierResponseDto.MedicamentDto();
        medicamentDto.setId(1L);
        medicamentDto.setNom("Doliprane");
        medicamentDto.setPrix_hospitalier(10.0f);
        medicamentDto.setPrix_public(15.0f);
        medicamentDto.setQuantite(100);
        dto.setMedicament(medicamentDto);
        
        return dto;
    }
} 