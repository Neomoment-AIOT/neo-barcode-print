// pdf-generator.js - Generate 57mm x 80mm PDF for barcode printing
// Created: 2025-07-22T15:02:00+05:00
// Purpose: Create exact size PDF for thermal printer compatibility on all platforms

/**
 * Generate PDF with exact dimensions 57mm x 80mm
 * @param {string} iqamaValue - Iqama ID value
 * @param {string} prescriptionValue - Prescription number
 * @param {number} counterValue - Queue counter
 */
function generatePDF(iqamaValue, prescriptionValue, counterValue) {
    // 2025-07-22T15:02:00+05:00: Direct PDF generation at exact 57mm x 80mm size
    
    // Import jsPDF library
    const { jsPDF } = window.jspdf;
    
    // Create PDF with exact thermal printer dimensions (57mm x 80mm)
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [57, 80] // Exact size: 57mm width x 80mm height
    });
    
    // Set font
    pdf.setFont('helvetica', 'normal');
    
    // Add queue number at top
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Queue: ${counterValue}`, 28.5, 15, { align: 'center' });
    
    // Add separator line
    pdf.line(5, 18, 52, 18);
    
    // Generate Iqama barcode
    generateBarcodeForPDF(pdf, iqamaValue, 'Iqama ID', 25);
    
    // Generate Prescription barcode  
    generateBarcodeForPDF(pdf, prescriptionValue, 'Prescription #', 45);
    
    // Add timestamp
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    const now = new Date();
    pdf.text(`${now.toLocaleString()}`, 28.5, 75, { align: 'center' });
    
    // Download PDF
    const filename = `barcode-${counterValue}-${Date.now()}.pdf`;
    pdf.save(filename);
    
    return filename;
}

/**
 * Generate barcode representation in PDF
 * @param {jsPDF} pdf - PDF instance
 * @param {string} value - Value to encode
 * @param {string} label - Label text
 * @param {number} y - Y position
 */
function generateBarcodeForPDF(pdf, value, label, y) {
    // Add label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 28.5, y - 2, { align: 'center' });
    
    // Create barcode pattern (simplified Code128-like pattern)
    const barcodeWidth = 45;
    const barcodeHeight = 8;
    const startX = (57 - barcodeWidth) / 2; // Center horizontally
    
    // Draw barcode bars (simplified representation)
    pdf.setFillColor(0, 0, 0); // Black bars
    
    // Generate bar pattern based on value
    const barPattern = generateBarPattern(value);
    let x = startX;
    const barWidth = barcodeWidth / barPattern.length;
    
    for (let i = 0; i < barPattern.length; i++) {
        if (barPattern[i] === '1') {
            pdf.rect(x, y, barWidth, barcodeHeight, 'F'); // Fill black bar
        }
        x += barWidth;
    }
    
    // Add human-readable text below barcode
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 28.5, y + barcodeHeight + 3, { align: 'center' });
}

/**
 * Generate simplified bar pattern for barcode
 * @param {string} value - Value to encode
 * @returns {string} - Binary pattern (1=bar, 0=space)
 */
function generateBarPattern(value) {
    // Simple encoding: convert each character to binary representation
    let pattern = '11010010'; // Start pattern
    
    for (let i = 0; i < value.length; i++) {
        const charCode = value.charCodeAt(i);
        const binary = (charCode % 127).toString(2).padStart(7, '0');
        pattern += binary;
    }
    
    pattern += '1100101'; // End pattern
    
    // Ensure pattern length is manageable
    if (pattern.length > 200) {
        pattern = pattern.substring(0, 200);
    }
    
    return pattern;
}

/**
 * Check if jsPDF library is loaded
 * @returns {boolean} - True if jsPDF is available
 */
function isPDFLibraryLoaded() {
    return typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF;
}

/**
 * Load jsPDF library dynamically if not present
 * @returns {Promise} - Promise that resolves when library is loaded
 */
function loadPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (isPDFLibraryLoaded()) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            if (isPDFLibraryLoaded()) {
                resolve();
            } else {
                reject(new Error('Failed to load jsPDF library'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF library'));
        document.head.appendChild(script);
    });
}

// Export functions
window.generatePDF = generatePDF;
window.loadPDFLibrary = loadPDFLibrary;
window.isPDFLibraryLoaded = isPDFLibraryLoaded;
