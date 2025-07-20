// script.js - Barcode Printer Application
// Created: 2025-07-19
// Updated: 2025-07-20 - Using direct print window
// Description: Handles barcode generation and printing functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const printBtn = document.getElementById('printBtn');
    const iqamaInput = document.getElementById('iqama');
    const prescriptionInput = document.getElementById('prescription');
    
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
            
            // Create a print window with all styles inline - maximized
            const printWindow = window.open('', '_blank', 'width='+screen.availWidth+',height='+screen.availHeight+',top=0,left=0,fullscreen=yes,menubar=yes,toolbar=yes,resizable=yes,scrollbars=yes,status=yes');
            
            // Create print content with barcodes inline
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Barcode Print</title>
                    <style>
                        @page {
                            size: 57mm auto;
                            margin: 0;
                        }
                        body {
                            width: 57mm;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .barcode-container {
                            width: 57mm;
                            padding: 2mm;
                        }
                        .barcode-item {
                            margin: 20mm 0;
                            text-align: center;
                        }
                        .barcode-label {
                            font-size: 10pt;
                            font-family: Arial, sans-serif;
                            font-weight: bold;
                            margin-bottom: 2mm;
                        }
                    </style>
                    <script src="JsBarcode.all.min.js"></script>
                </head>
                <body>
                    <div class="barcode-container">
                        <div class="barcode-item">
                            <div class="barcode-label">Iqama ID</div>
                            <svg id="barcode1"></svg>
                        </div>
                        <div class="barcode-item">
                            <div class="barcode-label">Prescription #</div>
                            <svg id="barcode2"></svg>
                        </div>
                    </div>
                    <script>
                        // Generate barcodes after the document is loaded
                        window.onload = function() {
                            JsBarcode("#barcode1", "${iqamaValue}", {
                                format: "CODE128",
                                width: 2,
                                height: 40,
                                displayValue: true,
                                fontSize: 10,
                                margin: 5
                            });
                            
                            JsBarcode("#barcode2", "${prescriptionValue}", {
                                format: "CODE128",
                                width: 2,
                                height: 40,
                                displayValue: true,
                                fontSize: 10,
                                margin: 5
                            });
                            
                            // Auto print when barcodes are ready
                            setTimeout(function() {
                                window.print();
                                // Close window after print dialog is closed
                                setTimeout(function() {
                                    window.close();
                                }, 1000);
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
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
