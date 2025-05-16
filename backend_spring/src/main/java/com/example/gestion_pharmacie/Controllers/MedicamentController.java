package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.Repositorys.MedicamentRepository;
import com.example.gestion_pharmacie.Services.ExcelLoaderService;
import com.example.gestion_pharmacie.Services.MedicamentScraperService;
import com.example.gestion_pharmacie.Services.MedicamentService;
import com.example.gestion_pharmacie.entites.Medicament;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/medicaments")
public class MedicamentController {
    private final MedicamentService medicamentService;
    private final ExcelLoaderService excelLoaderService;
    private final MedicamentScraperService medicamentScraperService;
    private final MedicamentRepository medicamentRepository;



    public MedicamentController(MedicamentService medicamentService, ExcelLoaderService excelLoaderService, MedicamentScraperService medicamentScraperService, MedicamentRepository medicamentRepository) {
        this.medicamentService = medicamentService;
        this.excelLoaderService = excelLoaderService;
        this.medicamentScraperService = medicamentScraperService;
        this.medicamentRepository = medicamentRepository;
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @PostMapping
    public ResponseEntity<Medicament> addMedicament(@RequestBody Medicament medicament) {
        return ResponseEntity.ok(medicamentService.saveMedicament(medicament));
    }

//    @PostMapping("/add-from-excel")
//    public ResponseEntity<Medicament> addMedicamentFromExcel(@RequestParam String code) {
//        return ResponseEntity.ok(medicamentService.addMedicamentFromExcel(code));
//    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @PutMapping("/{id}")
    public ResponseEntity<Medicament> updateMedicament(@PathVariable Long id, @RequestBody Medicament medicament) {
        return ResponseEntity.ok(medicamentService.updateMedicament(id, medicament));
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicament(@PathVariable Long id) {
        medicamentService.deleteMedicament(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @GetMapping("/my-medicaments")
    public ResponseEntity<List<Medicament>> getUserMedicaments() {
        return ResponseEntity.ok(medicamentService.getUserMedicaments());
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @GetMapping("/{id}")
    public ResponseEntity<Medicament> getMedicamentById(@PathVariable Long id) {
        return medicamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping
    public ResponseEntity<List<Medicament>> getAllMedicaments() {
        return ResponseEntity.ok(medicamentService.getAllMedicaments());
    }

//    @GetMapping("/excel")
//    public List<List<String>> getExcelData() {
//        return excelLoaderService.readExcelData();
//    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping("/search")
    public ResponseEntity<List<Medicament>> searchMedicaments(@RequestParam String nom) {
        return ResponseEntity.ok(medicamentService.searchMedicaments(nom));
    }

    @PreAuthorize("hasRole('FOURNISSEUR')")
    @PutMapping("/{id}/toggle-vente")
    public ResponseEntity<Medicament> toggleEnVente(@PathVariable Long id, @RequestParam boolean enVente) {
        return ResponseEntity.ok(medicamentService.toggleEnVente(id, enVente));
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping("/en-vente")
    public ResponseEntity<List<Medicament>> getMedicamentsEnVente() {
        List<Medicament> medicamentsEnVente = medicamentService.getMedicamentsEnVente();
        return ResponseEntity.ok(medicamentsEnVente);
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping("/fournisseur/{fournisseurId}")
    public ResponseEntity<List<Medicament>> getMedicamentsByFournisseur(@PathVariable Long fournisseurId) {
        return ResponseEntity.ok(medicamentService.getMedicamentsByFournisseur(fournisseurId));
    }

    


    //WEB SCRAPPING

    @GetMapping("/progressive-search")
    public ResponseEntity<List<Medicament>> progressiveSearch(@RequestParam String query) {
        try {
            List<Medicament> results = medicamentScraperService.progressiveSearch(query);
            return ResponseEntity.ok(results);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    @PostMapping("/detailed-scrape")
    public ResponseEntity<Medicament> getDetailedMedicamentInfo(@RequestBody Map<String, String> payload) {
        try {
            String url = payload.get("url");
            Medicament medicament = medicamentScraperService.getDetailedMedicamentInfo(url);
            return ResponseEntity.ok(medicament);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


}