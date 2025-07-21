// static_print.js - Static Barcode Printer
// Created: 2025-07-20T21:49:00+05:00
// Description: Generates static barcode image and prepares a print-ready page

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const printBtn = document.getElementById('printBtn');
    const iqamaInput = document.getElementById('iqama');
    const prescriptionInput = document.getElementById('prescription');
    
    // Initialize device ID (could be enhanced for better device identification)
    const deviceId = generateDeviceId();
    
    // Generate a semi-unique device identifier
    function generateDeviceId() {
        // Use existing fingerprint if available in localStorage
        if (localStorage.getItem('deviceId')) {
            return localStorage.getItem('deviceId');
        }
        
        // Generate a new one based on browser and device info
        const fingerprint = [
            navigator.userAgent,
            screen.width,
            screen.height,
            navigator.language,
            new Date().getTimezoneOffset()
        ].join('_');
        
        // Create a hash-like value from the fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        // Store and return device ID
        const deviceIdValue = 'device_' + Math.abs(hash).toString(16);
        localStorage.setItem('deviceId', deviceIdValue);
        return deviceIdValue;
    }
    
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
            
            // Get counter value from server
            incrementCounter(iqamaValue, prescriptionValue, deviceId)
                .then(counterData => {
                    // Continue with print process using the counter
                    generatePrintWindow(iqamaValue, prescriptionValue, counterData.counter);
                })
                .catch(error => {
                    console.error('Error getting counter:', error);
                    // Fall back to printing without counter if server fails
                    generatePrintWindow(iqamaValue, prescriptionValue, null);
                });
        } catch (error) {
            console.error('Error in print process:', error);
            alert('Error preparing print. Please try again. Details: ' + error.message);
        }
    }
    
    // Call server to increment counter
    async function incrementCounter(iqamaId, prescriptionNumber, deviceId) {
        try {
            const response = await fetch('/api/counter/increment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    iqamaId,
                    prescriptionNumber,
                    deviceId
                }),
            });
            
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Counter API error:', error);
            // Return fallback counter data
            return { counter: '---', error: error.message };
        }
    }
    
    // Generate the print window with barcodes
    function generatePrintWindow(iqamaValue, prescriptionValue, counterValue) {
        try {
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
                        // Variables to track print dialog state
                        let printDialogClosed = false;
                        let closeTimeout;
                        
                        // Auto print when the page is loaded
                        window.onload = function() {
                            // Display message to user
                            const msgDiv = document.createElement('div');
                            msgDiv.style.margin = '5mm 0';
                            msgDiv.style.padding = '2mm';
                            msgDiv.style.backgroundColor = '#f0f0f0';
                            msgDiv.style.borderRadius = '2mm';
                            msgDiv.style.textAlign = 'center';
                            msgDiv.style.fontSize = '9pt';
                            msgDiv.innerHTML = 'Window will close automatically after printing<br>or in 20 seconds.';
                            document.body.appendChild(msgDiv);
                            
                            // Wait for rendering to complete
                            setTimeout(function() {
                                try {
                                    window.print();
                                } catch (e) {
                                    console.error('Print error:', e);
                                }
                                
                                // Start auto-close countdown after print dialog appears
                                closeTimeout = setTimeout(function() {
                                    try {
                                        window.close();
                                    } catch (e) {
                                        console.error('Unable to close window:', e);
                                        // Update message if window cannot be closed
                                        msgDiv.innerHTML = 'Please close this window manually.';
                                        msgDiv.style.backgroundColor = '#ffe0e0';
                                    }
                                }, 20000); // 20 seconds
                            }, 500);
                        };
                        
                        // Try to detect when print dialog closes
                        window.addEventListener('focus', function() {
                            // When window regains focus, print dialog might have been closed
                            setTimeout(function() {
                                if (!printDialogClosed) {
                                    printDialogClosed = true;
                                    try {
                                        window.close();
                                    } catch (e) {
                                        console.error('Unable to close window after print:', e);
                                    }
                                }
                            }, 1000);
                        });
                    </script>
                </body>
                </html>
            `;
            
            // Add counter to the print page HTML if available
            let printPageWithCounter = printPage;
            if (counterValue) {
                // Insert counter before the closing body tag
                printPageWithCounter = printPage.replace('</body>', `
                    <div class="counter-section">
                        <div class="counter-label">Print #:</div>
                        <div class="counter-value">${counterValue}</div>
                    </div>
                    <style>
                        .counter-section {
                            margin-top: 5mm;
                            padding-top: 2mm;
                            border-top: 1px dashed #ccc;
                            text-align: center;
                        }
                        .counter-label {
                            font-size: 8pt;
                            font-weight: bold;
                            margin-bottom: 1mm;
                        }
                        .counter-value {
                            font-size: 14pt;
                            font-weight: bold;
                        }
                    </style>
                </body>`);
            }
            
            // Open a new window with the static content
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            printWindow.document.open();
            printWindow.document.write(printPageWithCounter);
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
