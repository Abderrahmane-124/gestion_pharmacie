package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.DTO.CommandeResponseDto;
import com.example.gestion_pharmacie.DTO.CreateCommandeRequest;
import com.example.gestion_pharmacie.Services.CommandeService;
import com.example.gestion_pharmacie.entites.StatutCommande;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommandeControllerTest {

    @Mock
    private CommandeService commandeService;

    @InjectMocks
    private CommandeController commandeController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(commandeController).build();
    }

    @Test
    void testCreateCommande() throws Exception {
        // Arrange
        CreateCommandeRequest request = new CreateCommandeRequest();
        CommandeResponseDto responseDto = new CommandeResponseDto();
        responseDto.setId(1L);
        
        when(commandeService.createCommande(any(CreateCommandeRequest.class))).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(post("/commandes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(commandeService, times(1)).createCommande(any(CreateCommandeRequest.class));
    }

    @Test
    void testGetCommandesForCurrentPharmacien() throws Exception {
        // Arrange
        List<CommandeResponseDto> commandes = Arrays.asList(new CommandeResponseDto(), new CommandeResponseDto());
        when(commandeService.getCommandesForCurrentPharmacien()).thenReturn(commandes);

        // Act & Assert
        mockMvc.perform(get("/commandes/current_pharmacien"))
                .andExpect(status().isOk());

        verify(commandeService, times(1)).getCommandesForCurrentPharmacien();
    }

    @Test
    void testGetCommandesForCurrentFournisseur() throws Exception {
        // Arrange
        List<CommandeResponseDto> commandes = Arrays.asList(new CommandeResponseDto(), new CommandeResponseDto());
        when(commandeService.getCommandesForCurrentFournisseur()).thenReturn(commandes);

        // Act & Assert
        mockMvc.perform(get("/commandes/current_fournisseur"))
                .andExpect(status().isOk());

        verify(commandeService, times(1)).getCommandesForCurrentFournisseur();
    }

    @Test
    void testGetAllCommands() throws Exception {
        // Arrange
        List<CommandeResponseDto> commandes = Arrays.asList(new CommandeResponseDto(), new CommandeResponseDto());
        when(commandeService.getAllCommandes()).thenReturn(commandes);

        // Act & Assert
        mockMvc.perform(get("/commandes/all"))
                .andExpect(status().isOk());

        verify(commandeService, times(1)).getAllCommandes();
    }

    @Test
    void testGetCommandeById() throws Exception {
        // Arrange
        CommandeResponseDto responseDto = new CommandeResponseDto();
        responseDto.setId(1L);
        when(commandeService.getCommandeById(1L)).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(get("/commandes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(commandeService, times(1)).getCommandeById(1L);
    }

    @Test
    void testUpdateCommandeStatus() throws Exception {
        // Arrange
        CommandeResponseDto responseDto = new CommandeResponseDto();
        responseDto.setId(1L);
        
        Map<String, String> statusUpdate = new HashMap<>();
        statusUpdate.put("status", StatutCommande.EN_COURS_DE_LIVRAISON.name());
        
        when(commandeService.updateCommandeStatus(eq(1L), any(StatutCommande.class))).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(put("/commandes/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk());

        verify(commandeService, times(1)).updateCommandeStatus(eq(1L), any(StatutCommande.class));
    }

    @Test
    void testMarkCommandeAsLivree() throws Exception {
        // Arrange
        CommandeResponseDto responseDto = new CommandeResponseDto();
        responseDto.setId(1L);
        
        when(commandeService.updateCommandeToLivree(1L)).thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(put("/commandes/1/livree"))
                .andExpect(status().isOk());

        verify(commandeService, times(1)).updateCommandeToLivree(1L);
    }
} 