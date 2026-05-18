package com.creaditn.creaditnbackend.service;

import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrService {

    private static final Pattern CIN_PATTERN = Pattern.compile("\\b\\d{8}\\b");

    /**
     * Simulates OCR extraction of CIN number from document image.
     * In production, this would call an external OCR API (e.g., Tesseract, Google Vision).
     */
    public String extractCinNumber(String imagePath) {
        // Placeholder: in a real implementation, this would send the image
        // to an OCR engine and parse the result.
        // For now, returns null indicating manual review is needed.
        return null;
    }

    public String extractCinFromText(String ocrText) {
        if (ocrText == null || ocrText.isEmpty()) return null;
        Matcher matcher = CIN_PATTERN.matcher(ocrText);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }
}
