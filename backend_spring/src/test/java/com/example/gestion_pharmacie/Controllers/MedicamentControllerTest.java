package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Services.ExcelLoaderService;
import com.example.gestion_pharmacie.Services.MedicamentScraperService;
import com.example.gestion_pharmacie.Services.MedicamentService;
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

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MedicamentControllerTest {

    @Mock
    private MedicamentService medicamentService;

    @Mock
    private ExcelLoaderService excelLoaderService;

    @Mock
    private MedicamentScraperService medicamentScraperService;

    @Mock
    private MedicamentRepository medicamentRepository;

    @InjectMocks
    private MedicamentController medicamentController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(medicamentController).build();
    }

    @Test
    void testAddMedicament() throws Exception {
        // Arrange
        Medicament medicament = createSampleMedicament();
        when(medicamentService.saveMedicament(any(Medicament.class))).thenReturn(medicament);

        // Act & Assert
        mockMvc.perform(post("/medicaments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(medicament)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(medicamentService, times(1)).saveMedicament(any(Medicament.class));
    }

    @Test
    void testUpdateMedicament() throws Exception {
        // Arrange
        Medicament medicament = createSampleMedicament();
        when(medicamentService.updateMedicament(eq(1L), any(Medicament.class))).thenReturn(medicament);

        // Act & Assert
        mockMvc.perform(put("/medicaments/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(medicament)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(medicamentService, times(1)).updateMedicament(eq(1L), any(Medicament.class));
    }

    @Test
    void testDeleteMedicament() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/medicaments/1"))
                .andExpect(status().isNoContent());

        verify(medicamentService, times(1)).deleteMedicament(1L);
    }

    @Test
    void testGetUserMedicaments() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentService.getUserMedicaments()).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments/my-medicaments"))
                .andExpect(status().isOk());

        verify(medicamentService, times(1)).getUserMedicaments();
    }

    @Test
    void testGetMedicamentById() throws Exception {
        // Arrange
        Medicament medicament = createSampleMedicament();
        when(medicamentRepository.findById(1L)).thenReturn(Optional.of(medicament));

        // Act & Assert
        mockMvc.perform(get("/medicaments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(medicamentRepository, times(1)).findById(1L);
    }

    @Test
    void testGetMedicamentByIdNotFound() throws Exception {
        // Arrange
        when(medicamentRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/medicaments/1"))
                .andExpect(status().isNotFound());

        verify(medicamentRepository, times(1)).findById(1L);
    }

    @Test
    void testGetAllMedicaments() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentService.getAllMedicaments()).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments"))
                .andExpect(status().isOk());

        verify(medicamentService, times(1)).getAllMedicaments();
    }

    @Test
    void testSearchMedicaments() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentService.searchMedicaments("Doliprane")).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments/search")
                .param("nom", "Doliprane"))
                .andExpect(status().isOk());

        verify(medicamentService, times(1)).searchMedicaments("Doliprane");
    }

    @Test
    void testToggleEnVente() throws Exception {
        // Arrange
        Medicament medicament = createSampleMedicament();
        medicament.setEn_vente(true);
        when(medicamentService.toggleEnVente(eq(1L), eq(true))).thenReturn(medicament);

        // Act & Assert
        mockMvc.perform(put("/medicaments/1/toggle-vente")
                .param("enVente", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.en_vente").value(true));

        verify(medicamentService, times(1)).toggleEnVente(1L, true);
    }

    @Test
    void testGetMedicamentsEnVente() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentService.getMedicamentsEnVente()).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments/en-vente"))
                .andExpect(status().isOk());

        verify(medicamentService, times(1)).getMedicamentsEnVente();
    }

    @Test
    void testGetMedicamentsByFournisseur() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentService.getMedicamentsByFournisseur(1L)).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments/fournisseur/1"))
                .andExpect(status().isOk());

        verify(medicamentService, times(1)).getMedicamentsByFournisseur(1L);
    }

    @Test
    void testProgressiveSearch() throws Exception {
        // Arrange
        List<Medicament> medicaments = Arrays.asList(
            createSampleMedicament(),
            createSampleMedicament()
        );
        when(medicamentScraperService.progressiveSearch("Doliprane")).thenReturn(medicaments);

        // Act & Assert
        mockMvc.perform(get("/medicaments/progressive-search")
                .param("query", "Doliprane"))
                .andExpect(status().isOk());

        verify(medicamentScraperService, times(1)).progressiveSearch("Doliprane");
    }

    @Test
    void testProgressiveSearchWithError() throws Exception {
        // Arrange
        when(medicamentScraperService.progressiveSearch("Doliprane")).thenThrow(new IOException("Error"));

        // Act & Assert
        mockMvc.perform(get("/medicaments/progressive-search")
                .param("query", "Doliprane"))
                .andExpect(status().isInternalServerError());

        verify(medicamentScraperService, times(1)).progressiveSearch("Doliprane");
    }

    @Test
    void testGetDetailedMedicamentInfo() throws Exception {
        // Arrange
        Medicament medicament = createSampleMedicament();
        Map<String, String> payload = new HashMap<>();
        payload.put("url", "http://example.com/medicament");
        
        when(medicamentScraperService.getDetailedMedicamentInfo(anyString())).thenReturn(medicament);

        // Act & Assert
        mockMvc.perform(post("/medicaments/detailed-scrape")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(medicamentScraperService, times(1)).getDetailedMedicamentInfo(anyString());
    }

    private Medicament createSampleMedicament() {
        Medicament medicament = new Medicament();
        medicament.setId(1L);
        medicament.setNom("Doliprane");
        medicament.setPrix_hospitalier(10);
        medicament.setPrix_public(15);
        medicament.setQuantite(100);
        medicament.setEn_vente(false);
        return medicament;
    }
} 