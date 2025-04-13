package com.example.gestion_pharmacie.Services;

import com.example.gestion_pharmacie.entites.Medicament;
import com.example.gestion_pharmacie.entites.Utilisateur;
import org.apache.poi.ss.usermodel.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ExcelLoaderService {

    public List<List<String>> readExcelData() {
        List<List<String>> data = new ArrayList<>();

        try {
            ClassPathResource resource = new ClassPathResource("data/medicaments.xlsx");
            InputStream inputStream = resource.getInputStream();

            Workbook workbook = WorkbookFactory.create(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                List<String> rowData = new ArrayList<>();
                for (Cell cell : row) {
                    cell.setCellType(CellType.STRING);
                    rowData.add(cell.getStringCellValue());
                }
                data.add(rowData);
            }

            workbook.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return data;
    }

    public Medicament findMedicamentByCode(String code) {
        try {
            ClassPathResource resource = new ClassPathResource("data/medicaments.xlsx");
            InputStream inputStream = resource.getInputStream();

            Workbook workbook = WorkbookFactory.create(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            Row headerRow = sheet.getRow(0);
            Map<String, Integer> columnIndexMap = new HashMap<>();

            // Find column indices
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    columnIndexMap.put(cell.getStringCellValue().trim(), i);
                }
            }

            // Validate required columns exist
            if (!columnIndexMap.containsKey("CODE")) {
                throw new IllegalStateException("CODE column not found in Excel file");
            }

            // Search for the code
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell codeCell = row.getCell(columnIndexMap.get("CODE"));
                    if (codeCell != null) {
                        codeCell.setCellType(CellType.STRING);
                        String excelCode = codeCell.getStringCellValue();

                        if (code.equals(excelCode)) {
                            Medicament medicament = new Medicament();

                            // Set medication name
                            if (columnIndexMap.containsKey("NOM")) {
                                Cell nomCell = row.getCell(columnIndexMap.get("NOM"));
                                if (nomCell != null) {
                                    nomCell.setCellType(CellType.STRING);
                                    medicament.setNom(nomCell.getStringCellValue());
                                }
                            }

                            // Build description from multiple fields
                            StringBuilder description = new StringBuilder();
                            appendFieldIfExists(row, columnIndexMap, "DCI1", description, "DCI: ");
                            appendFieldIfExists(row, columnIndexMap, "DOSAGE1", description, "Dosage: ");
                            appendFieldIfExists(row, columnIndexMap, "UNITE_DOSAGE1", description, "");
                            appendFieldIfExists(row, columnIndexMap, "FORME", description, "Forme: ");
                            appendFieldIfExists(row, columnIndexMap, "PRESENTATION", description, "Présentation: ");

                            medicament.setDescription(description.toString().trim());

                            workbook.close();
                            return medicament;
                        }
                    }
                }
            }

            workbook.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private void appendFieldIfExists(Row row, Map<String, Integer> columnMap, String columnName,
                                    StringBuilder builder, String prefix) {
        if (columnMap.containsKey(columnName)) {
            Cell cell = row.getCell(columnMap.get(columnName));
            if (cell != null) {
                cell.setCellType(CellType.STRING);
                String value = cell.getStringCellValue();
                if (!value.isEmpty()) {
                    if (builder.length() > 0) {
                        builder.append(", ");
                    }
                    builder.append(prefix).append(value);
                }
            }
        }
    }
}