package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.entites.Medicament;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MedicamentScraperService {

    private final MedicamentRepository medicamentRepository;
    
    @Autowired
    public MedicamentScraperService(MedicamentRepository medicamentRepository) {
        this.medicamentRepository = medicamentRepository;
    }
    


    private float parsePrice(String priceText) {
        Pattern pattern = Pattern.compile("(\\d+(?:[.,]\\d+)?)");
        Matcher matcher = pattern.matcher(priceText);
        if (matcher.find()) {
            String priceStr = matcher.group(1).replace(",", ".");
            return Float.parseFloat(priceStr);
        }
        throw new NumberFormatException("Could not parse price from: " + priceText);
    }
    

    public List<Medicament> progressiveSearch(String query) throws IOException {
        if (query == null || query.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Get first letter and capitalize it for the URL
        char firstLetter = Character.toUpperCase(query.charAt(0));
        String searchPrefix = query.toLowerCase();
        List<Medicament> results = new ArrayList<>();
        Set<String> foundNames = new HashSet<>();
        
        // Search through pages for the first letter
        for (int page = 1; page <= 30; page++) {
            String url = "https://medicament.ma/listing-des-medicaments/page/" + page + "/?lettre=" + firstLetter;
            
            try {
                Document doc = Jsoup.connect(url)
                        .timeout(3000)  // 3 second timeout
                        .get();
                
                Elements medicamentLinks = doc.select("table tr td a");
                if (medicamentLinks.isEmpty()) {
                    break; // No more results for this letter
                }
                
                boolean exactMatchFound = false;
                
                for (Element link : medicamentLinks) {
                    String medicamentName = link.text().trim();
                    
                    // Clean the name by removing price information (anything after "PPV" or "-")
                    if (medicamentName.contains(" - PPV:")) {
                        medicamentName = medicamentName.substring(0, medicamentName.indexOf(" - PPV:"));
                    } else if (medicamentName.contains(" - ")) {
                        medicamentName = medicamentName.substring(0, medicamentName.indexOf(" - "));
                    }
                    
                    String medicamentNameLower = medicamentName.toLowerCase();
                    
                    // Check if this medication's name contains our search term
                    if (medicamentNameLower.contains(searchPrefix)) {
                        // Skip if we've already found this medication
                        if (foundNames.contains(medicamentNameLower)) {
                            continue;
                        }
                        
                        foundNames.add(medicamentNameLower);
                        
                        // Basic medicament with just the name
                        String detailUrl = link.attr("href");
                        Medicament basicMedicament = new Medicament();
                        basicMedicament.setNom(medicamentName);
                        // Store the URL in a temporary field
                        basicMedicament.setTableau(detailUrl); // Use tableau field temporarily to store URL
                        
                        // If it's an exact match, try to get full details
                        if (medicamentNameLower.equals(searchPrefix)) {
                            try {
                                Medicament medicament = getDetailedMedicamentInfo(detailUrl);
                                results.add(0, medicament); // Add to beginning of list
                                exactMatchFound = true;
                            } catch (Exception e) {
                                results.add(0, basicMedicament);
                                exactMatchFound = true;
                            }
                        } else {
                            // For partial matches, just add the basic info
                            results.add(basicMedicament);
                        }
                        
                        // Limit to 10 results for performance
                        if (results.size() >= 20) {
                            break;
                        }
                    }
                }
                
                // If exact match found or we have enough results, stop searching
                if (exactMatchFound || results.size() >= 20) {
                    break;
                }
            } catch (IOException e) {
                System.err.println("Error on page " + page + " for letter " + firstLetter + ": " + e.getMessage());
            }
        }
        
        return results;
    }


    public Medicament getDetailedMedicamentInfo(String detailUrl) throws IOException {
        // Connect with a proper user agent to avoid being blocked
        Document doc = Jsoup.connect(detailUrl)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .timeout(5000)
                .get();
        
        Medicament medicament = new Medicament();
        System.out.println("Processing URL: " + detailUrl);

        // Extract title (medication name)
        String title = doc.select("h1.entry-title").text().trim();
        if (title.isEmpty()) {
            title = doc.select("h1").text().trim();
        }
        medicament.setNom(title);
        
        // Extract all details from tables - look for both label-value pairs
        Elements tables = doc.select("table");
        for (Element table : tables) {
            Elements rows = table.select("tr");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.size() < 2) continue;
                
                String label = cells.get(0).text().trim();
                String value = cells.get(1).text().trim();
                
                if (value.isEmpty()) continue;
                
                // Match labels to entity properties
                switch (label.toLowerCase()) {
                    case "présentation":
                        medicament.setPresentation(value);
                        break;
                    case "composition":
                        medicament.setComposition(value);
                        break;
                    case "classe thérapeutique":
                        medicament.setClasse_therapeutique(value);
                        break;
                    case "code atc":
                        medicament.setCode_ATC(value);
                        break;
                    case "dosage":
                        medicament.setDosage(value);
                        break;
                    case "ppv" :
                        try {
                            float price = parsePrice(value);
                            medicament.setPrix_public(price);
                        } catch (NumberFormatException e) {
                            System.err.println("Error parsing PPV: " + value);
                        }
                        break;
                    case "ppc" :
                        try {
                            float price = parsePrice(value);
                            medicament.setPrix_conseille(price);
                        } catch (NumberFormatException e) {
                            System.err.println("Error parsing PPV: " + value);
                        }
                        break;
                    case "prix hospitalier":
                        try {
                            float price = parsePrice(value);
                            medicament.setPrix_hospitalier(price);
                        } catch (NumberFormatException e) {
                            System.err.println("Error parsing Prix hospitalier: " + value);
                        }
                        break;
                    case "indication(s)":
                    case "indications":
                        medicament.setIndications(value);
                        break;
                    case "nature du produit":
                        medicament.setNatureDuProduit(value);
                        break;
                    case "tableau":
                        medicament.setTableau(value);
                        break;

                }
            }
        }
        
        // If we still don't have the dosage, try to extract it from the name
        if (medicament.getDosage() == null && title.contains(" ")) {
            String[] parts = title.split(" ");
            for (int i = 1; i < parts.length; i++) {
                if (parts[i].matches(".*\\d+.*")) {
                    medicament.setDosage(parts[i] + (i+1 < parts.length ? " " + parts[i+1] : ""));
                    break;
                }
            }
        }
        
        // Debug print the extracted data
        System.out.println("Extracted medicament: " + medicament.getNom());
        System.out.println("Dosage: " + medicament.getDosage());
        System.out.println("Prix public: " + medicament.getPrix_public());
        
        return medicament;
    }
}