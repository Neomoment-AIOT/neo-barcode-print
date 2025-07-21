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

// API endpoint to get next counter number without incrementing
app.get('/api/counter/next', (req, res) => {
    try {
        // Generate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get current counter data
        const counterData = getCounterData();
        
        // Find the highest counter value for today only
        let todayCounter = 0;
        Object.values(counterData.counters).forEach(item => {
            // Only consider today's entries when determining the counter
            if (item.date === today) {
                todayCounter = Math.max(todayCounter, item.counter);
            }
        });
        
        // The next counter would be the current highest plus one
        const nextCounter = todayCounter + 1;
        
        res.json({ nextCounter });
    } catch (error) {
        console.error('Error getting next counter:', error);
        res.status(500).json({ error: 'Failed to get next counter' });
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
        
        // Get current counter data
        const counterData = getCounterData();
        
        // Find the highest counter value for today only
        let todayCounter = 0;
        Object.values(counterData.counters).forEach(item => {
            // Only consider today's entries when determining the counter
            if (item.date === today) {
                todayCounter = Math.max(todayCounter, item.counter);
            }
        });
        
        // Create a unique key for this combination WITHOUT deviceId
        // This ensures same Iqama+Prescription+date gets same counter
        const uniqueKey = `${iqamaId}_${prescriptionNumber}_${today}`;
        console.log("86 unique key", uniqueKey);
        // Check if this exact combination exists already
        let existingEntry = null;
        Object.entries(counterData.counters).forEach(([key, value]) => {
            console.log("89 key", key);
            console.log("90 value", value);
            if (key.startsWith(uniqueKey)) {
                existingEntry = value;
            }
            console.log("92 existingEntry", existingEntry);
        });
        
        let counterValue;
        
        // If this is a new combination, increment the counter
        if (!existingEntry) {
            // This is a new combination, increment the counter
            counterValue = todayCounter + 1;
            console.log("New combination - incrementing counter to:", counterValue);
        } else {
            // Use the existing counter value (don't increment)
            counterValue = existingEntry.counter;
            console.log("Existing combination - reusing counter:", counterValue);
        }
        
        // Store with the device ID included in the key for tracking
        const storageKey = `${uniqueKey}_${deviceId || 'unknown'}`;
        
        // Set the counter value
        counterData.counters[storageKey] = {
            counter: counterValue,
            iqamaId,
            prescriptionNumber,
            date: today,
            deviceId: deviceId || 'unknown',
            timestamp: new Date().toISOString()
        };
        
        // Update last updated timestamp
        counterData.lastUpdated = new Date().toISOString();
        
        // Save the updated counter data
        saveCounterData(counterData);
        
        // Return the counter value for this combination
        res.json({ 
            counter: counterData.counters[storageKey].counter,
            uniqueKey: storageKey
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
