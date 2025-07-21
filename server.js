// server.js - Simple Node.js server for barcode print counter
// Created: 2025-07-21T16:38:14+05:00
// Description: Handles print counter storage and retrieval via JSON

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(__dirname));

// Path to the counter storage file
const COUNTER_FILE = path.join(__dirname, 'print_counter.json');

// Initialize counter storage if it doesn't exist
function initCounterStorage() {
    if (!fs.existsSync(COUNTER_FILE)) {
        const initialData = { 
            counters: {},
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(COUNTER_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Get counter data
function getCounterData() {
    initCounterStorage();
    const data = fs.readFileSync(COUNTER_FILE, 'utf8');
    return JSON.parse(data);
}

// Save counter data
function saveCounterData(data) {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2));
}

// API endpoint to get current counter
app.get('/api/counter', (req, res) => {
    try {
        const counterData = getCounterData();
        res.json(counterData);
    } catch (error) {
        console.error('Error getting counter:', error);
        res.status(500).json({ error: 'Failed to retrieve counter data' });
    }
});

// API endpoint to increment counter
app.post('/api/counter/increment', (req, res) => {
    try {
        const { iqamaId, prescriptionNumber, deviceId } = req.body;
        
        if (!iqamaId || !prescriptionNumber) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        // Generate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Create a unique key for this combination
        const uniqueKey = `${iqamaId}_${prescriptionNumber}_${today}_${deviceId || 'unknown'}`;
        
        // Get current counter data
        const counterData = getCounterData();
        
        // Check if this is a new combination
        if (!counterData.counters[uniqueKey]) {
            // Find the highest counter value
            const currentValues = Object.values(counterData.counters);
            const highestCounter = currentValues.length > 0 
                ? Math.max(...currentValues.map(item => item.counter)) 
                : 0;
                
            // Set the new counter value
            counterData.counters[uniqueKey] = {
                counter: highestCounter + 1,
                iqamaId,
                prescriptionNumber,
                date: today,
                deviceId: deviceId || 'unknown',
                timestamp: new Date().toISOString()
            };
        }
        
        // Update last updated timestamp
        counterData.lastUpdated = new Date().toISOString();
        
        // Save the updated counter data
        saveCounterData(counterData);
        
        // Return the counter value for this combination
        res.json({ 
            counter: counterData.counters[uniqueKey].counter,
            uniqueKey
        });
    } catch (error) {
        console.error('Error incrementing counter:', error);
        res.status(500).json({ error: 'Failed to increment counter' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initCounterStorage();
});
