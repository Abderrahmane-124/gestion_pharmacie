package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.entites.GroqChatRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GroqServiceTest {

    @Mock
    private DatabaseQueryService databaseQueryService;
    
    @Mock
    private RestTemplate restTemplate;
    
    @InjectMocks
    private GroqService groqService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // Set the RestTemplate mock using reflection since it's a final field in the service
        ReflectionTestUtils.setField(groqService, "restTemplate", restTemplate);
        
        // Set API values
        ReflectionTestUtils.setField(groqService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(groqService, "apiUrl", "https://api.test.com/chat");
    }

    @Test
    void getChatResponse_Success() {
        // Arrange
        String userMessage = "What medicines do we have?";
        
        Map<String, Object> databaseData = new HashMap<>();
        databaseData.put("medicaments", List.of(Map.of("nom", "Doliprane", "quantite", 10)));
        
        // Mock database query service
        when(databaseQueryService.getRelevantData(userMessage)).thenReturn(databaseData);
        
        // Mock API response
        Map<String, Object> messageMap = new HashMap<>();
        messageMap.put("content", "You have Doliprane in stock.");
        
        Map<String, Object> choiceMap = new HashMap<>();
        choiceMap.put("message", messageMap);
        
        List<Map<String, Object>> choices = List.of(choiceMap);
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("choices", choices);
        
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);
        
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);
        
        // Act
        String response = groqService.getChatResponse(userMessage);
        
        // Assert
        assertEquals("You have Doliprane in stock.", response);
        
        // Verify database was queried
        verify(databaseQueryService, times(1)).getRelevantData(userMessage);
        
        // Verify the API was called with the right parameters
        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).exchange(
                eq("https://api.test.com/chat"),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(Map.class)
        );
        
        // Verify the request contains the right structure
        HttpEntity<GroqChatRequest> capturedEntity = entityCaptor.getValue();
        assertNotNull(capturedEntity.getBody());
        GroqChatRequest chatRequest = (GroqChatRequest) capturedEntity.getBody();
        assertEquals("meta-llama/llama-4-scout-17b-16e-instruct", chatRequest.getModel());
        assertEquals(2, chatRequest.getMessages().size());
    }

    @Test
    void getChatResponse_ApiError() {
        // Arrange
        String userMessage = "What medicines do we have?";
        
        Map<String, Object> databaseData = new HashMap<>();
        when(databaseQueryService.getRelevantData(userMessage)).thenReturn(databaseData);
        
        // Mock error response
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(new HashMap<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);
        
        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            groqService.getChatResponse(userMessage);
        });
        
        assertTrue(exception.getMessage().contains("Failed to get response from Groq API"));
    }
    
    @Test
    void formatDatabaseData_Success() {
        // Arrange
        Map<String, Object> data = new HashMap<>();
        data.put("medicaments", List.of(Map.of("nom", "Doliprane", "quantite", 10)));
        data.put("pharmaciens", List.of(Map.of("nom", "Dr. Smith", "id", 1)));
        
        // Act
        String result = ReflectionTestUtils.invokeMethod(groqService, "formatDatabaseData", data);
        
        // Assert
        assertNotNull(result);
        assertTrue(result.contains("medicaments"));
        assertTrue(result.contains("Doliprane"));
        assertTrue(result.contains("pharmaciens"));
        assertTrue(result.contains("Dr. Smith"));
    }
    
    @Test
    void formatDatabaseData_Error() {
        // Arrange
        Map<String, Object> data = new HashMap<>();
        data.put("invalidObject", new Object() {
            @Override
            public String toString() {
                throw new RuntimeException("Test exception");
            }
        });
        
        // Act
        String result = ReflectionTestUtils.invokeMethod(groqService, "formatDatabaseData", data);
        
        // Assert
        assertNotNull(result);
        assertTrue(result.contains("Error formatting database data"));
    }
} 