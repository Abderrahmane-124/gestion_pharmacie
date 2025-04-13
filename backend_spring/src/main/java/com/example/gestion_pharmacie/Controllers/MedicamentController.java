package com.example.gestion_pharmacie.Controllers;

import com.example.gestion_pharmacie.Services.ExcelLoaderService;
import com.example.gestion_pharmacie.Services.MedicamentService;
import com.example.gestion_pharmacie.entites.Medicament;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/medicaments")
public class MedicamentController {
    private final MedicamentService medicamentService;
    private final ExcelLoaderService excelLoaderService;


    public MedicamentController(MedicamentService medicamentService, ExcelLoaderService excelLoaderService) {
        this.medicamentService = medicamentService;
        this.excelLoaderService = excelLoaderService;
    }

    @PreAuthorize("hasAnyRole('FOURNISSEUR', 'PHARMACIEN')")
    @PostMapping
    public ResponseEntity<Medicament> addMedicament(@RequestBody Medicament medicament) {
        return ResponseEntity.ok(medicamentService.saveMedicament(medicament));
    }

    @PostMapping("/add-from-excel")
    public ResponseEntity<Medicament> addMedicamentFromExcel(@RequestParam String code) {
        return ResponseEntity.ok(medicamentService.addMedicamentFromExcel(code));
    }

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
    @GetMapping("/my-medications")
    public ResponseEntity<List<Medicament>> getUserMedicaments() {
        return ResponseEntity.ok(medicamentService.getUserMedicaments());
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping
    public ResponseEntity<List<Medicament>> getAllMedicaments() {
        return ResponseEntity.ok(medicamentService.getAllMedicaments());
    }

    @GetMapping("/excel")
    public List<List<String>> getExcelData() {
        return excelLoaderService.readExcelData();
    }

    @PreAuthorize("hasAnyRole('PHARMACIEN', 'FOURNISSEUR')")
    @GetMapping("/search")
    public ResponseEntity<List<Medicament>> searchMedicaments(@RequestParam String nom) {
        return ResponseEntity.ok(medicamentService.searchMedicaments(nom));
    }
}