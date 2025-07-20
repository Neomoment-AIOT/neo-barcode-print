// static_print.js - Static Barcode Printer
// Created: 2025-07-20T21:49:00+05:00
// Description: Generates static barcode image and prepares a print-ready page

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
            
            // Generate barcodes in memory first
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            document.body.appendChild(tempContainer);
            
            // Create SVGs in the temp container
            const svgIqama = document.createElement('svg');
            svgIqama.id = 'temp-barcode-iqama';
            const svgPrescription = document.createElement('svg');
            svgPrescription.id = 'temp-barcode-prescription';
            
            tempContainer.appendChild(svgIqama);
            tempContainer.appendChild(svgPrescription);
            
            // Generate the barcodes
            JsBarcode("#temp-barcode-iqama", iqamaValue, {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 10,
                margin: 5
            });
            
            JsBarcode("#temp-barcode-prescription", prescriptionValue, {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 10,
                margin: 5
            });
            
            // Get the SVG strings
            const iqamaSvgContent = tempContainer.querySelector('#temp-barcode-iqama').outerHTML;
            const prescriptionSvgContent = tempContainer.querySelector('#temp-barcode-prescription').outerHTML;
            
            // Remove the temp container
            document.body.removeChild(tempContainer);
            
            // Create a static HTML page with the barcodes embedded
            const printPage = `
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
                            font-family: Arial, sans-serif;
                        }
                        .barcode-container {
                            width: 57mm;
                            padding: 2mm;
                        }
                        .barcode-item {
                            margin: 10mm 0;
                            text-align: center;
                        }
                        .barcode-label {
                            font-size: 10pt;
                            font-family: Arial, sans-serif;
                            font-weight: bold;
                            margin-bottom: 2mm;
                        }
                        /* Make sure SVGs display properly */
                        svg {
                            width: 50mm;
                            height: auto;
                            display: block;
                            margin: 0 auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="barcode-container">
                        <div class="barcode-item">
                            <div class="barcode-label">Iqama ID</div>
                            ${iqamaSvgContent}
                        </div>
                        <div class="barcode-item">
                            <div class="barcode-label">Prescription #</div>
                            ${prescriptionSvgContent}
                        </div>
                    </div>
                    <script>
                        // Auto print when the page is loaded
                        window.onload = function() {
                            // Wait for rendering to complete
                            setTimeout(function() {
                                window.print();
                                // Don't close automatically - let the user close it
                            }, 500);
                        }
                    </script>
                </body>
                </html>
            `;
            
            // Open a new window with the static content
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.open();
            printWindow.document.write(printPage);
            printWindow.document.close();
            
        } catch (error) {
            console.error('Error generating static barcodes:', error);
            alert('Error generating barcodes. Please try again. Details: ' + error.message);
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
