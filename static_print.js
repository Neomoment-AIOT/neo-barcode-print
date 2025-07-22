// static_print.js - Static Barcode Printer
// Created: 2025-07-20T21:49:00+05:00
// Description: Generates static barcode image and prepares a print-ready page

// 2025-07-21T23:52:50+05:00: Removed localStorage for queue number tracking
// Now using database exclusively for queue number tracking

// Function to update queue number display in UI
function updateQueueNumberDisplay(queueNumber) {
    // Update the UI with the queue number from database
    const nextQueueElement = document.getElementById('next-queue-number');
    if (nextQueueElement) {
        nextQueueElement.textContent = queueNumber || 'Loading...';
    }
}

// Function to fetch and display next queue number
// 2025-07-22T00:41:50+05:00: Updated to handle empty DB case and show '1' instead of 'Error'
// 2025-07-22T01:40:00+05:00: Added debug logging to trace API call paths
async function fetchNextQueueNumber() {
    try {
        // Get current input values
        const iqamaValue = document.getElementById('iqama').value.trim();
        const prescriptionValue = document.getElementById('prescription').value.trim();
        
        console.log('🔍 DEBUG: fetchNextQueueNumber called');
        console.log('🔍 DEBUG: iqamaValue="' + iqamaValue + '", prescriptionValue="' + prescriptionValue + '"');
        
        // Use base URL of the current page to handle both local and deployed environments
        const baseUrl = window.location.protocol === 'file:' 
            ? 'http://localhost:3000' // Use localhost when on file:// protocol
            : ''; // Use relative URL when on http:// or https:// (for Vercel)
        
        // If we have both values, check if this combination already exists
        if (iqamaValue && prescriptionValue) {
            // 2025-07-22T02:42:00+05:00: Generate deviceId within function scope
            const deviceId = generateDeviceId();
            console.log('🔍 DEBUG: Taking PATH 1 - calling /api/counter/increment with actual values, deviceId:', deviceId);
            // Use the increment endpoint with checkOnly=true to see what number would be assigned
            const response = await fetch(`${baseUrl}/api/counter/increment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    iqamaId: iqamaValue,
                    prescriptionNumber: prescriptionValue,
                    deviceId: deviceId,
                    checkOnly: true // Don't actually increment, just check
                })
            });
            
            if (!response.ok) {
                // 2025-07-22T02:08:00+05:00: NEVER show incorrect queue numbers
                console.error('API error status:', response.status);
                console.warn('API error - keeping current display to avoid showing wrong queue number');
                return; // Keep current display (Loading...) instead of showing wrong number
            }
            
            const data = await response.json();
            console.log('🔍 DEBUG: PATH 1 API response:', data);
            
            // Update queue number in UI
            if (data.counter) {
                console.log('🔍 DEBUG: PATH 1 updating queue number to:', data.counter);
                updateQueueNumberDisplay(data.counter);
            } else {
                // 2025-07-22T02:08:00+05:00: NEVER show incorrect queue numbers
                console.warn('No counter in API response - keeping current display to avoid showing wrong number');
                // Keep current display instead of showing wrong number
            }
        } else {
            console.log('🔍 DEBUG: Taking PATH 2 - input fields empty, getting highest counter for today');
            try {
                // 2025-07-22T01:57:00+05:00: Fixed to show actual next queue number for today
                // Get the actual highest counter for today and show next number
                const apiUrl = `${baseUrl}/api/counter`;
                console.log('🔍 DEBUG: Making API call to get all counters:', apiUrl);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    // 2025-07-22T02:12:00+05:00: NEVER show incorrect queue numbers
                    console.error('400 error - keeping current display to avoid showing wrong queue number');
                    console.warn('API 400 error - maintaining current display state');
                    return; // Keep current display instead of showing wrong number
                    throw new Error('Server error: ' + response.status);
                }
                
                const data = await response.json();
                console.log('🔍 DEBUG: PATH 2 API response:', data);
                
                // 2025-07-22T01:58:00+05:00: Calculate actual next queue number from all counters for today
                const today = new Date().toISOString().split('T')[0];
                let highestCounter = 0;
                
                // Find highest counter for today
                if (data.counters && typeof data.counters === 'object') {
                    Object.values(data.counters).forEach(counterInfo => {
                        if (counterInfo.date === today && counterInfo.counter > highestCounter) {
                            highestCounter = counterInfo.counter;
                        }
                    });
                }
                
                const nextCounter = highestCounter + 1;
                console.log('🔍 DEBUG: PATH 2 calculated next counter:', nextCounter, '(highest today:', highestCounter, ')');
                updateQueueNumberDisplay(nextCounter);
            } catch (apiError) {
                console.error('Next queue API error:', apiError);
                // 2025-07-22T02:07:00+05:00: NEVER show incorrect queue numbers - keep loading state
                // Don't update display with wrong value - let it stay as 'Loading...'
                console.warn('API error - keeping current display to avoid showing wrong queue number');
            }
        }
    } catch (error) {
        console.error('Next queue API error:', error);
        // 2025-07-22T02:07:00+05:00: NEVER show incorrect queue numbers - keep loading state
        // Don't update display with wrong value - let it stay as 'Loading...'
        console.warn('General error - keeping current display to avoid showing wrong queue number');
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fetch the next queue number
    fetchNextQueueNumber();
    
    // Refresh the queue number every 30 seconds
    setInterval(fetchNextQueueNumber, 30000);
    
    // Get DOM elements
    const printBtn = document.getElementById('printBtn');
    const iqamaInput = document.getElementById('iqama');
    const prescriptionInput = document.getElementById('prescription');
    const clearBtn = document.getElementById('clearBtn');
    
    // Auto-clear timer
    let autoClearTimer = null;
    
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
    
    // Function to clear form fields
    function clearFields() {
        iqamaInput.value = '';
        prescriptionInput.value = '';
        // Focus on the first field
        iqamaInput.focus();
        // Clear any existing auto-clear timer
        if (autoClearTimer) {
            clearTimeout(autoClearTimer);
            autoClearTimer = null;
        }
    }
    
    // Set up event listener for the print button
    printBtn.addEventListener('click', handlePrint);
    
    // Set up event listener for the clear button
    clearBtn.addEventListener('click', clearFields);
    
    // Add event listeners to input fields to update queue number on change
    iqamaInput.addEventListener('change', fetchNextQueueNumber);
    prescriptionInput.addEventListener('change', fetchNextQueueNumber);
    
    // Print window close handler
    function handlePrintWindowClose() {
        printWindow = null;
        console.log('Print window closed');
        
        // Clear the form fields when print window closes
        document.getElementById('iqama').value = '';
        document.getElementById('prescription').value = '';
        
        // Refresh the queue number
        fetchNextQueueNumber();
    }
    
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
                    // Update queue number in UI
                    if (counterData.counter) {
                        updateQueueNumberDisplay(counterData.counter);
                    }
                    // Continue with print process using the counter
                    generatePrintWindow(iqamaValue, prescriptionValue, counterData.counter);
                    
                    // Set auto-clear timer for 20 seconds after printing
                    if (autoClearTimer) {
                        clearTimeout(autoClearTimer);
                    }
                    autoClearTimer = setTimeout(() => {
                        clearFields();
                        console.log('Fields auto-cleared after 60 seconds');
                    }, 60000); // 60 seconds
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
            // Use base URL of the current page to handle both local and deployed environments
            const baseUrl = window.location.protocol === 'file:' 
                ? 'http://localhost:3000' // Use localhost when on file:// protocol
                : ''; // Use relative URL when on http:// or https:// (for Vercel)
                
            const response = await fetch(`${baseUrl}/api/counter/increment`, {
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
            // 2025-07-21T23:59:10+05:00: Removed localStorage fallback to ensure database consistency
            // Display an error message to the user instead
            alert('Error connecting to the server. Please try again later.');
            return { counter: 'Error', error: error.message };
        }
    }
    
    // Generate the print window with barcodes
    // 2025-07-22T00:49:30+05:00: Fixed barcode generation for Vercel deployment
    function generatePrintWindow(iqamaValue, prescriptionValue, counterValue) {
        try {
            // Ensure we have valid values
            const safeIqamaValue = iqamaValue || 'N/A';
            const safePrescriptionValue = prescriptionValue || 'N/A';
            // 2025-07-22T02:12:00+05:00: NEVER use '1' as fallback - use actual counter value or Loading
            const safeCounterValue = (counterValue && counterValue !== 'Error') ? counterValue : 'Loading...';
            
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
            
            try {
                // Generate the barcodes
                JsBarcode("#temp-barcode-iqama", safeIqamaValue, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: true,
                    fontSize: 10,
                    margin: 5
                });
                
                JsBarcode("#temp-barcode-prescription", safePrescriptionValue, {
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
                
                // Create pre-rendered barcode content
                createPrintWindow(safeIqamaValue, safePrescriptionValue, safeCounterValue, iqamaSvgContent, prescriptionSvgContent);
            } catch (barcodeError) {
                // If JsBarcode fails, create text-only version
                console.error('Barcode generation error:', barcodeError);
                createTextBackupPrintWindow(safeIqamaValue, safePrescriptionValue, safeCounterValue);
            } finally {
                // Clean up the temp container
                try {
                    document.body.removeChild(tempContainer);
                } catch (e) {
                    console.warn('Error removing temp container:', e);
                }
            }
        } catch (error) {
            console.error('Error in print window generation:', error);
            alert('Error generating print window. Please try again. Details: ' + error.message);
        }
    }
    
    // Helper function to create print window with pre-rendered barcode SVGs
    function createPrintWindow(iqamaValue, prescriptionValue, counterValue, iqamaSvgContent, prescriptionSvgContent) {
        // Create a static HTML page with the barcodes embedded
        const printPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode Print</title>
                <style>
                    /* 2025-07-22T14:13:00+05:00: Fixed Android compatibility - custom sizes cause 'printer not available' errors */
                    @page {
                        /* Original custom size caused Android issues: size: 57mm auto; */
                        margin: 2mm; /* Small margins for mobile compatibility */
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
                        margin: 2mm 0;
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
                    /* Counter styling */
                    .counter-section {
                        margin: 0;
                        padding: 2mm;
                        text-align: center;
                        border-bottom: 1px dashed #ccc;
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
                    .footer {
                        margin-top: 5mm;
                        padding-top: 2mm;
                        border-top: 1px dashed #ccc;
                        text-align: center;
                        font-size: 9pt;
                    }
                </style>
            </head>
            <body>
                <!-- Counter display at the top -->
                <div class="counter-section">
                    <div class="counter-label">Queue Number:</div>
                    <div class="counter-value">${counterValue}</div>
                </div>
                
                <div class="barcode-container" style="margin-top: 0;">
                    <div class="barcode-item">
                        <div class="barcode-label">Iqama ID</div>
                        ${iqamaSvgContent}
                    </div>
                    <div class="barcode-item">
                        <div class="barcode-label">Prescription #</div>
                        ${prescriptionSvgContent}
                    </div>
                    <!-- 2025-07-22T13:34:00+05:00: Removed bottom queue number display as per user request -->
                    <!-- Original queue number display:
                    <div class="barcode-item">
                        <div class="barcode-label">Queue #:</div>
                        <div class="counter-value">${counterValue}</div>
                    </div>
                    -->
                </div>
                
                <div class="footer">
                    Window will close automatically after printing<br>or in 20 seconds.
                </div>
                
                <script>
                    // Auto print when the page is loaded
                    window.onload = function() {
                        // Wait for rendering to complete
                        setTimeout(function() {
                            try {
                                window.print();
                            } catch (e) {
                                console.error('Print error:', e);
                            }
                            
                            // Auto-close after 20 seconds
                            setTimeout(function() {
                                try {
                                    window.close();
                                } catch (e) {
                                    console.error('Window close error:', e);
                                }
                            }, 20000);
                        }, 500);
                    };
                    
                    // Close window when print dialog is closed
                    window.addEventListener('afterprint', function() {
                        setTimeout(function() {
                            try {
                                window.close();
                            } catch (e) {
                                console.error('Window close error after print:', e);
                            }
                        }, 1000);
                    });
                </script>
            </body>
            </html>
        `;
        
        try {
            // Open a new window with the static content
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            if (!printWindow) {
                alert('Pop-up blocker may be preventing the print window from opening. Please allow pop-ups for this site.');
                return;
            }
            
            printWindow.document.open();
            printWindow.document.write(printPage);
            printWindow.document.close();
        } catch (windowError) {
            console.error('Error opening print window:', windowError);
            alert('Unable to open print window. Please check pop-up settings and try again.');
        }
    }
    
    // Fallback function for text-only printing when barcode generation fails
    function createTextBackupPrintWindow(iqamaValue, prescriptionValue, counterValue) {
        const printPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode Print</title>
                <style>
                    /* 2025-07-22T14:13:00+05:00: Fixed Android compatibility - custom sizes cause 'printer not available' errors */
                    @page {
                        /* Original custom size caused Android issues: size: 57mm auto; */
                        margin: 2mm; /* Small margins for mobile compatibility */
                    }
                    body {
                        width: 57mm;
                        margin: 0;
                        padding: 0;
                        background: white;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        width: 57mm;
                        padding: 5mm;
                    }
                    .item {
                        margin: 4mm 0;
                        text-align: center;
                        border: 1px solid #000;
                        padding: 3mm;
                    }
                    .label {
                        font-size: 10pt;
                        font-weight: bold;
                        margin-bottom: 2mm;
                    }
                    .value {
                        font-size: 14pt;
                        font-family: monospace;
                        letter-spacing: 1px;
                    }
                    .counter-section {
                        text-align: center;
                        border-bottom: 1px dashed #ccc;
                        padding-bottom: 4mm;
                        margin-bottom: 4mm;
                    }
                    .counter-value {
                        font-size: 18pt;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="counter-section">
                        <div class="label">Queue Number:</div>
                        <div class="counter-value">${counterValue}</div>
                    </div>
                    
                    <div class="item">
                        <div class="label">Iqama ID</div>
                        <div class="value">${iqamaValue}</div>
                    </div>
                    
                    <div class="item">
                        <div class="label">Prescription #</div>
                        <div class="value">${prescriptionValue}</div>
                    </div>
                    
                    <div style="text-align:center; margin-top:10mm; font-size:9pt;">
                        Text backup mode (barcode unavailable)
                    </div>
                </div>
                
                <script>
                    // Auto print when the page is loaded
                    window.onload = function() {
                        setTimeout(function() {
                            try { window.print(); } catch (e) {}
                            setTimeout(function() {
                                try { window.close(); } catch (e) {}
                            }, 20000);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        
        try {
            // Open a new window with the text backup
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            if (printWindow) {
                printWindow.document.open();
                printWindow.document.write(printPage);
                printWindow.document.close();
            } else {
                alert('Pop-up blocker may be preventing the print window from opening. Please allow pop-ups for this site.');
            }
        } catch (windowError) {
            console.error('Error opening backup print window:', windowError);
            alert('Unable to open print window. Please check browser settings and try again.');
        }
    }
    
    // 2025-07-22T02:00:00+05:00: Add real-time queue number updates for idempotency
    // Simple debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Update queue number whenever input fields change
    const updateQueueOnInput = debounce(() => {
        const currentIqama = iqamaInput.value.trim();
        const currentPrescription = prescriptionInput.value.trim();
        console.log('🎯 INPUT LISTENER TRIGGERED! Iqama:', currentIqama, 'Prescription:', currentPrescription);
        fetchNextQueueNumber();
    }, 500); // Wait 500ms after user stops typing
    
    iqamaInput.addEventListener('input', () => {
        console.log('🎯 Iqama input changed to:', iqamaInput.value);
        updateQueueOnInput();
    });
    prescriptionInput.addEventListener('input', () => {
        console.log('🎯 Prescription input changed to:', prescriptionInput.value);
        updateQueueOnInput();
    });
    
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
