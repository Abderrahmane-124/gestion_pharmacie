package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.Medicament;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class MedicamentScraperServiceTest {

    @Mock
    private MedicamentRepository medicamentRepository;

    @InjectMocks
    private MedicamentScraperService medicamentScraperService;

    @Mock
    private Connection connection;

    @Mock
    private Document document;

    @Mock
    private Elements elements;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void progressiveSearch_Success() throws IOException {
        // This test uses a MockedStatic for Jsoup which is only available in Mockito 3.4.0 or higher
        // If your project has a lower version, you might need to refactor this test

        try (MockedStatic<Jsoup> jsoupMockedStatic = mockStatic(Jsoup.class)) {
            // Mock the Jsoup connect behavior
            jsoupMockedStatic.when(() -> Jsoup.connect(anyString())).thenReturn(connection);
            when(connection.timeout(anyInt())).thenReturn(connection);
            when(connection.get()).thenReturn(document);

            // Create mock elements
            Element linkElement1 = mock(Element.class);
            Element linkElement2 = mock(Element.class);
            Element detailsTableCell = mock(Element.class);
            Elements detailsCells = mock(Elements.class);
            Elements tableRows = mock(Elements.class);
            Elements tables = mock(Elements.class);
            
            // Set up the behavior
            when(document.select("table tr td a")).thenReturn(elements);
            when(elements.isEmpty()).thenReturn(false);
            when(elements.iterator()).thenReturn(List.of(linkElement1, linkElement2).iterator());
            
            when(linkElement1.text()).thenReturn("Doliprane 500mg - PPV: 10.5");
            when(linkElement1.attr("href")).thenReturn("https://medicament.ma/doliprane-500mg");
            when(linkElement2.text()).thenReturn("Doliprane 1000mg - 12.5");
            when(linkElement2.attr("href")).thenReturn("https://medicament.ma/doliprane-1000mg");
            
            // Mock the detailed info page
            Document detailDoc = mock(Document.class);
            Connection detailConnection = mock(Connection.class);
            
            jsoupMockedStatic.when(() -> Jsoup.connect("https://medicament.ma/doliprane-500mg")).thenReturn(detailConnection);
            when(detailConnection.userAgent(anyString())).thenReturn(detailConnection);
            when(detailConnection.timeout(anyInt())).thenReturn(detailConnection);
            when(detailConnection.get()).thenReturn(detailDoc);
            
            // Mock title and tables
            when(detailDoc.select("h1.entry-title")).thenReturn(elements);
            when(elements.text()).thenReturn("Doliprane 500mg");
            when(detailDoc.select("table")).thenReturn(tables);
            when(tables.iterator()).thenReturn(List.of(mock(Element.class)).iterator());
            
            // Mock table rows for detailed information
            Element tableElement = mock(Element.class);
            when(tables.get(0)).thenReturn(tableElement);
            when(tableElement.select("tr")).thenReturn(tableRows);
            when(tableRows.iterator()).thenReturn(List.of(mock(Element.class), mock(Element.class)).iterator());
            
            // Setup rows with cells
            Element row1 = mock(Element.class);
            Element row2 = mock(Element.class);
            when(tableRows.get(0)).thenReturn(row1);
            when(tableRows.get(1)).thenReturn(row2);
            
            // Setup cells for each row
            Elements row1Cells = mock(Elements.class);
            Elements row2Cells = mock(Elements.class);
            when(row1.select("td")).thenReturn(row1Cells);
            when(row2.select("td")).thenReturn(row2Cells);
            when(row1Cells.size()).thenReturn(2);
            when(row2Cells.size()).thenReturn(2);
            
            // Cell content
            Element cell1_1 = mock(Element.class);
            Element cell1_2 = mock(Element.class);
            Element cell2_1 = mock(Element.class);
            Element cell2_2 = mock(Element.class);
            
            when(row1Cells.get(0)).thenReturn(cell1_1);
            when(row1Cells.get(1)).thenReturn(cell1_2);
            when(row2Cells.get(0)).thenReturn(cell2_1);
            when(row2Cells.get(1)).thenReturn(cell2_2);
            
            when(cell1_1.text()).thenReturn("ppv");
            when(cell1_2.text()).thenReturn("10.50 DH");
            when(cell2_1.text()).thenReturn("composition");
            when(cell2_2.text()).thenReturn("Paracetamol");
            
            // Perform the search
            List<Medicament> results = medicamentScraperService.progressiveSearch("doli");
            
            // Verify results
            assertNotNull(results);
            assertEquals(2, results.size());
            assertEquals("Doliprane 500mg", results.get(0).getNom());
//            assertEquals(10.5, results.get(0).getPrix_public());
            assertEquals("Doliprane 1000mg", results.get(1).getNom());
        }
    }

    @Test
    void progressiveSearch_EmptyQuery() throws IOException {
        // Test with empty query
        List<Medicament> results = medicamentScraperService.progressiveSearch("");
        
        assertNotNull(results);
        assertTrue(results.isEmpty());
        
        // Test with null query
        results = medicamentScraperService.progressiveSearch(null);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }



    @Test
    void getDetailedMedicamentInfo_Success() throws IOException {
        // Mock the web page
        try (MockedStatic<Jsoup> jsoupMockedStatic = mockStatic(Jsoup.class)) {
            String detailUrl = "https://medicament.ma/doliprane-500mg";
            
            // Setup connection and document
            jsoupMockedStatic.when(() -> Jsoup.connect(detailUrl)).thenReturn(connection);
            when(connection.userAgent(anyString())).thenReturn(connection);
            when(connection.timeout(anyInt())).thenReturn(connection);
            when(connection.get()).thenReturn(document);
            
            // Mock title
            Elements titleElements = mock(Elements.class);
            when(document.select("h1.entry-title")).thenReturn(titleElements);
            when(titleElements.text()).thenReturn("Doliprane 500mg");
            
            // Mock tables with medication details
            Elements tables = mock(Elements.class);
            Element table = mock(Element.class);
            Elements rows = mock(Elements.class);
            
            when(document.select("table")).thenReturn(tables);
            when(tables.iterator()).thenReturn(List.of(table).iterator());
            when(table.select("tr")).thenReturn(rows);
            
            // Create table rows with medication details
            Element row1 = mock(Element.class); // PPV
            Element row2 = mock(Element.class); // Prix hospitalier
            Element row3 = mock(Element.class); // Composition
            
            when(rows.iterator()).thenReturn(List.of(row1, row2, row3).iterator());
            
            // Row 1: PPV
            Elements row1Cells = mock(Elements.class);
            Element cell1_1 = mock(Element.class);
            Element cell1_2 = mock(Element.class);
            when(row1.select("td")).thenReturn(row1Cells);
            when(row1Cells.size()).thenReturn(2);
            when(row1Cells.get(0)).thenReturn(cell1_1);
            when(row1Cells.get(1)).thenReturn(cell1_2);
            when(cell1_1.text()).thenReturn("PPV");
            when(cell1_2.text()).thenReturn("10.50 DH");
            
            // Row 2: Prix hospitalier
            Elements row2Cells = mock(Elements.class);
            Element cell2_1 = mock(Element.class);
            Element cell2_2 = mock(Element.class);
            when(row2.select("td")).thenReturn(row2Cells);
            when(row2Cells.size()).thenReturn(2);
            when(row2Cells.get(0)).thenReturn(cell2_1);
            when(row2Cells.get(1)).thenReturn(cell2_2);
            when(cell2_1.text()).thenReturn("Prix Hospitalier");
            when(cell2_2.text()).thenReturn("8.20 DH");
            
            // Row 3: Composition
            Elements row3Cells = mock(Elements.class);
            Element cell3_1 = mock(Element.class);
            Element cell3_2 = mock(Element.class);
            when(row3.select("td")).thenReturn(row3Cells);
            when(row3Cells.size()).thenReturn(2);
            when(row3Cells.get(0)).thenReturn(cell3_1);
            when(row3Cells.get(1)).thenReturn(cell3_2);
            when(cell3_1.text()).thenReturn("Composition");
            when(cell3_2.text()).thenReturn("Paracétamol 500mg");
            
            // Get the detailed info
            Medicament result = medicamentScraperService.getDetailedMedicamentInfo(detailUrl);
            
            // Verify result
            assertNotNull(result);
            assertEquals("Doliprane 500mg", result.getNom());
            assertEquals(10.5f, result.getPrix_public());
            assertEquals(8.2f, result.getPrix_hospitalier());
            assertEquals("Paracétamol 500mg", result.getComposition());
        }
    }

} 