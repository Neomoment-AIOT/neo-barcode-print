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
            
            // Remove any logo elements completely for printing
            const printLogo = document.querySelector('.print-logo');
            if (printLogo) {
                printLogo.style.display = 'none';
                printLogo.style.visibility = 'hidden';
                printLogo.style.width = '0';
                printLogo.style.height = '0';
                printLogo.style.margin = '0';
                printLogo.style.padding = '0';
            }
            
            // Ensure print area is displayed for preview and printing
            printArea.style.display = 'block';
            // Apply additional styles to make sure content is visible and centered in preview
            printArea.style.position = 'absolute';
            printArea.style.left = '50%';
            printArea.style.transform = 'translateX(-50%)';
            printArea.style.top = '20px';
            printArea.style.width = '57mm';
            printArea.style.backgroundColor = 'white';
            printArea.style.zIndex = '9999';
            printArea.style.padding = '10px';
            printArea.style.border = '1px solid #eee';
            
            // Wait a bit longer to ensure content is fully rendered
            setTimeout(function() {
                window.print();
                
                // Hide print area after printing
                setTimeout(function() {
                    // Reset styles
                    printArea.style.display = 'none';
                    printArea.style.position = '';
                    printArea.style.zIndex = '';
                }, 1000);
            }, 500); // Increased timeout for better rendering
            
            // 2025-07-20T20:06:14+05:00: Modified to ensure content is visible in print preview
            
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
