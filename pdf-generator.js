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
    // 2025-07-22T16:45:00+05:00: Fixed queue number display - ensure it's a string/number, not object
    const queueNumber = typeof counterValue === 'object' ? (counterValue.counter || counterValue.value || 'N/A') : counterValue;
    pdf.text(`Queue: ${queueNumber}`, 28.5, 15, { align: 'center' });
    
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
    
    // 2025-07-22T16:08:00+05:00: Generate PDF and print automatically (no download)
    const pdfBlob = pdf.output('blob');
    
    // Create object URL for the PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open PDF in hidden window and auto-print
    const printWindow = window.open(pdfUrl, '_blank', 'width=400,height=600');
    
    if (printWindow) {
        printWindow.onload = function() {
            // Auto-print the PDF without user intervention
            setTimeout(() => {
                printWindow.print();
                
                // Auto-close after printing
                setTimeout(() => {
                    printWindow.close();
                    URL.revokeObjectURL(pdfUrl); // Clean up
                }, 2000);
            }, 500);
        };
    } else {
        alert('Pop-up blocker prevented printing. Please allow pop-ups for this site.');
        URL.revokeObjectURL(pdfUrl);
    }
    
    return `barcode-${counterValue}-${Date.now()}.pdf`;
}

/**
 * Generate Code 128 barcode in PDF using JsBarcode
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
    
    try {
        // 2025-07-22T16:45:00+05:00: Generate proper Code 128 barcode using JsBarcode
        // Create temporary canvas for barcode generation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for barcode
        canvas.width = 350; // High resolution for quality
        canvas.height = 80;
        
        // Generate Code 128 barcode
        if (window.JsBarcode) {
            JsBarcode(canvas, value, {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: false, // We'll add text separately
                background: "#ffffff",
                lineColor: "#000000",
                margin: 0
            });
            
            // Convert canvas to image data and add to PDF
            const imgData = canvas.toDataURL('image/png');
            const barcodeWidth = 45;
            const barcodeHeight = 8;
            const startX = (57 - barcodeWidth) / 2;
            
            pdf.addImage(imgData, 'PNG', startX, y, barcodeWidth, barcodeHeight);
        } else {
            // Fallback if JsBarcode not available
            pdf.setFontSize(6);
            pdf.text('Barcode library not loaded', 28.5, y + 4, { align: 'center' });
        }
    } catch (error) {
        console.error('Barcode generation error:', error);
        // Fallback - just show the value
        pdf.setFontSize(8);
        pdf.text(value, 28.5, y + 4, { align: 'center' });
    }
    
    // Add human-readable text below barcode
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 28.5, y + 10, { align: 'center' });
}

// 2025-07-22T16:45:00+05:00: Removed old generateBarPattern function - now using proper Code 128 with JsBarcode

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
