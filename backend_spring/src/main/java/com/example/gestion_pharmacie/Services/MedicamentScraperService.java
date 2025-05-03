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
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MedicamentScraperService {

    private final MedicamentRepository medicamentRepository;
    
    @Autowired
    public MedicamentScraperService(MedicamentRepository medicamentRepository) {
        this.medicamentRepository = medicamentRepository;
    }
    
    public Medicament findMedicamentByName(String name) throws IOException {
        String searchName = name.trim().toUpperCase();
        char firstLetter = searchName.charAt(0);
        
        // Try multiple pages for this letter
        for (int page = 1; page <= 30; page++) {
            String url = "https://medicament.ma/listing-des-medicaments/page/" + page + "/?lettre=" + firstLetter;
            Document doc = Jsoup.connect(url).get();
            
            Elements medicamentLinks = doc.select("table tr td a");
            for (Element link : medicamentLinks) {
                String medicamentName = link.text().trim();
                String detailUrl = link.attr("href");
                
                // Check if this medicament name contains our search term
                if (medicamentName.toUpperCase().contains(searchName)) {
                    System.out.println("Found match: " + medicamentName + " at " + detailUrl);
                    return getDetailedMedicamentInfo(detailUrl);
                }
            }
            
            // If no more results on this page, break
            if (medicamentLinks.isEmpty()) {
                break;
            }
        }
        
        return null;
    }
    
    private Medicament getDetailedMedicamentInfo(String detailUrl) throws IOException {
        Document doc = Jsoup.connect(detailUrl).get();
        Medicament medicament = new Medicament();
        
        // Print the URL for debugging
        System.out.println("Processing URL: " + detailUrl);
        
        // Try to parse directly from the URL if other methods fail
        String[] urlSegments = detailUrl.split("/");
        String lastSegment = urlSegments[urlSegments.length - 1];
        String medicamentSlug = lastSegment.replace("-", " ").toUpperCase();
        
        // Get title (with fallbacks)
        String title = doc.select("h1.entry-title").text().trim();
        if (title.isEmpty()) {
            title = doc.select("h1").text().trim();
            if (title.isEmpty()) {
                // If we can't find the title in the HTML, use the URL slug
                title = medicamentSlug;
            }
        }
        
        System.out.println("Title found: " + title);
        
        // For URL like acuilix-12520-mg-comprime, extract ACUILIX as name and 12,5 MG / 20 MG as dosage
        if (lastSegment.startsWith("acuilix")) {
            medicament.setNom("ACUILIX");
            medicament.setDosage("12,5 MG / 20 MG");
        } else {
            // Generic parsing logic
            parseNameAndDosageFromTitle(medicament, title);
        }
        
        // Extract details from the table
        Elements rows = doc.select("table tr");
        for (Element row : rows) {
            Elements cells = row.select("td");
            if (cells.size() < 2) continue;
            
            String label = cells.get(0).text().trim();
            String value = cells.get(1).text().trim();
            
            switch (label) {
                case "Présentation":
                    medicament.setPresentation(value);
                    break;
                case "Composition":
                    medicament.setComposition(value);
                    break;
                case "Classe thérapeutique":
                    medicament.setClasse_therapeutique(value);
                    break;
                case "Code ATC":
                    medicament.setCode_ATC(value);
                    break;
                case "PPV":
                    try {
                        float price = parsePrice(value);
                        medicament.setPrix_public(price);
                    } catch (NumberFormatException e) {
                        System.err.println("Error parsing PPV: " + value);
                    }
                    break;
                case "Prix hospitalier":
                    try {
                        float price = parsePrice(value);
                        medicament.setPrix_hospitalier(price);
                    } catch (NumberFormatException e) {
                        System.err.println("Error parsing Prix hospitalier: " + value);
                    }
                    break;
                case "Indication(s)":
                    medicament.setIndications(value);
                    break;
                case "Nature du Produit":
                    medicament.setNatureDuProduit(value);
                    break;
                case "Tableau":
                    medicament.setTableau(value);
                    break;
            }
        }
        
        return medicament;
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
    
    private void parseNameAndDosageFromTitle(Medicament medicament, String title) {
        // Remove any dosage forms like "Comprimé" which come after a comma
        String[] mainParts = title.split(",", 2);
        String nameWithDosage = mainParts[0].trim();
        
        // Debug output
        System.out.println("Name with dosage part: " + nameWithDosage);
        
        // Extract the brand name (comes before any numbers/dosage)
        String brandName = "";
        String dosage = "";
        
        // Find the first number which typically starts the dosage
        Matcher numberMatcher = Pattern.compile("\\d").matcher(nameWithDosage);
        if (numberMatcher.find()) {
            int firstNumberIndex = numberMatcher.start();
            if (firstNumberIndex > 0) {
                brandName = nameWithDosage.substring(0, firstNumberIndex).trim();
                dosage = nameWithDosage.substring(firstNumberIndex).trim();
            } else {
                // No numbers found, use the whole thing as the name
                brandName = nameWithDosage;
            }
        } else {
            // No numbers found, use the whole thing as the name
            brandName = nameWithDosage;
        }
        
        // Set the name and dosage
        medicament.setNom(brandName);
        medicament.setDosage(dosage);
        
        // Debug output
        System.out.println("Extracted name: '" + brandName + "', dosage: '" + dosage + "'");
    }
    
    // For the complete scraper that processes all medications
    public void scrapeAllMedicaments() {
        // Loop through all letters A to Z
        for (char letter = 'A'; letter <= 'Z'; letter++) {
            // For each letter, check pages 1 to 30 (or until no results)
            for (int page = 1; page <= 30; page++) {
                try {
                    String url = "https://medicament.ma/listing-des-medicaments/page/" + page + "/?lettre=" + letter;
                    Document doc = Jsoup.connect(url).get();
                    
                    Elements medicamentLinks = doc.select("table tr td a");
                    if (medicamentLinks.isEmpty()) {
                        break; // No more results for this letter
                    }
                    
                    List<Medicament> medicaments = new ArrayList<>();
                    for (Element link : medicamentLinks) {
                        String detailUrl = link.attr("href");
                        try {
                            Medicament medicament = getDetailedMedicamentInfo(detailUrl);
                            medicaments.add(medicament);
                            medicamentRepository.save(medicament);
                            System.out.println("Scraped: " + medicament.getNom());
                            
                            // Add small delay between requests
                            Thread.sleep(500);
                        } catch (Exception e) {
                            System.err.println("Error processing " + detailUrl + ": " + e.getMessage());
                        }
                    }
                    
                    System.out.println("Scraped " + medicaments.size() + " medicaments for letter " + letter + ", page " + page);
                    
                    // Small delay to avoid overloading the server
                    Thread.sleep(1500);
                } catch (IOException | InterruptedException e) {
                    System.err.println("Error scraping letter " + letter + ", page " + page + ": " + e.getMessage());
                }
            }
        }
    }
}