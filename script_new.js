// script.js - Barcode Printer Application
// Created: 2025-07-19
// Updated: 2025-07-20 - Modified to print directly without popup window
// Description: Handles barcode generation and printing functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const printBtn = document.getElementById('printBtn');
    const iqamaInput = document.getElementById('iqama');
    const prescriptionInput = document.getElementById('prescription');
    const printArea = document.getElementById('printArea');
    const barcodeIqama = document.getElementById('barcode-iqama-print');
    const barcodePrescription = document.getElementById('barcode-prescription-print');
    
    // Add event listener to the print button
    printBtn.addEventListener('click', handlePrint);
    
    // Handle print functionality
    function handlePrint() {
        try {
            // Validate inputs
            const iqamaValue = iqamaInput.value.trim();
            const prescriptionValue = prescriptionInput.value.trim();
            
            if (!iqamaValue || !prescriptionValue) {
                alert('Please fill in both Iqama ID and Prescription #');
                return;
            }
            
            // Generate barcodes directly in the hidden print area
            JsBarcode(barcodeIqama, iqamaValue, {
                format: 'CODE128',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 12,
                margin: 10,
                lineColor: '#000000',
                background: '#ffffff'
            });
            
            JsBarcode(barcodePrescription, prescriptionValue, {
                format: 'CODE128',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 12,
                margin: 10,
                lineColor: '#000000',
                background: '#ffffff'
            });
            
            // Show print area before printing
            printArea.style.display = 'block';
            
            // Print directly
            setTimeout(function() {
                window.print();
                
                // Hide print area after printing
                setTimeout(function() {
                    printArea.style.display = 'none';
                }, 1000);
            }, 300);
            
        } catch (error) {
            console.error('Error generating barcodes:', error);
            alert('Error generating barcodes. Please try again.');
        }
    }
    
    // Handle keyboard enter key press
    [iqamaInput, prescriptionInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                printBtn.click();
            }
        });
    });
});
