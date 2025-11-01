//package com.example.gestion_pharmacie.Controllers;
//
//import com.example.gestion_pharmacie.Services.GroqService;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.MockitoAnnotations;
//import org.springframework.http.MediaType;
//import org.springframework.test.web.servlet.MockMvc;
//import org.springframework.test.web.servlet.setup.MockMvcBuilders;
//
//import java.util.HashMap;
//import java.util.Map;
//
//import static org.mockito.ArgumentMatchers.anyString;
//import static org.mockito.Mockito.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//class ChatControllerTest {
//
//    @Mock
//    private GroqService groqService;
//
//    @InjectMocks
//    private ChatController chatController;
//
//    private MockMvc mockMvc;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
//    }
//
//    @Test
//    void testChat_ShouldReturnResponse() throws Exception {
//        // Arrange
//        String userMessage = "Comment fonctionnent les médicaments?";
//        String expectedResponse = "Voici des informations sur les médicaments...";
//
//        // Configure mock to return the expected response
//        when(groqService.getChatResponse(anyString())).thenReturn(expectedResponse);
//
//        // Act & Assert
//        mockMvc.perform(post("/api/chat")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content("{\"message\":\"" + userMessage + "\"}"))
//                .andExpect(status().isOk())
//                .andExpect(content().string(expectedResponse));
//
//        // Verify the service was called with the correct message
//        verify(groqService, times(1)).getChatResponse(userMessage);
//    }
//
//    @Test
//    void testChat_WithEmptyMessage_ShouldStillWork() throws Exception {
//        // Arrange
//        String expectedResponse = "Je n'ai pas compris votre demande. Pouvez-vous préciser?";
//        when(groqService.getChatResponse(anyString())).thenReturn(expectedResponse);
//
//        // Act & Assert
//        mockMvc.perform(post("/api/chat")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content("{\"message\":\"\"}"))
//                .andExpect(status().isOk())
//                .andExpect(content().string(expectedResponse));
//
//        verify(groqService, times(1)).getChatResponse("");
//    }
//
//    @Test
//    void testChat_DirectMethod() {
//        // Arrange
//        String userMessage = "Quels sont les médicaments disponibles?";
//        String expectedResponse = "Voici la liste des médicaments disponibles...";
//        Map<String, String> payload = new HashMap<>();
//        payload.put("message", userMessage);
//
//        when(groqService.getChatResponse(userMessage)).thenReturn(expectedResponse);
//
//        // Act
//        String actualResponse = chatController.chat(payload);
//
//        // Assert
//        verify(groqService, times(1)).getChatResponse(userMessage);
//        assert actualResponse.equals(expectedResponse);
//    }
//}