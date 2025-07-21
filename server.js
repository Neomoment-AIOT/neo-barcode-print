// server.js - Simple Node.js server for barcode print counter
// Created: 2025-07-21T16:38:14+05:00
// Updated: 2025-07-21T23:37:00+05:00 - Added PostgreSQL support for production
// Description: Handles print counter storage and retrieval via database or JSON

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import database module
const db = require('./db');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(__dirname));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Path to the counter storage file (fallback for local development)
const COUNTER_FILE = path.join(__dirname, 'print_counter.json');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV;
const useDatabase = isProduction || process.env.USE_DATABASE === 'true';

// Initialize the app
// 2025-07-21T23:52:45+05:00: Removed database initialization as it's now handled by init_db.js script
async function initApp() {
    // Database initialization is now handled by the standalone init_db.js script
    if (useDatabase) {
        console.log('Using PostgreSQL database for counter storage');
        
        // Verify database connection without initializing tables
        try {
            const client = await db.pool.connect();
            console.log('Database connection verified successfully');
            client.release();
        } catch (error) {
            console.error('Database connection error, falling back to JSON storage:', error);
            // Fall back to JSON mode on database connection error
            useDatabase = false;
        }
    } else {
        console.log('Using JSON file for counter storage (development mode)');
    }
}

// Initialize counter storage if it doesn't exist (JSON fallback)
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
async function getCounterData() {
    if (useDatabase) {
        try {
            return await db.getAllCounters();
        } catch (error) {
            console.error('Database error, falling back to JSON:', error);
            // Fall back to JSON if database fails
            return getJsonCounterData();
        }
    } else {
        return getJsonCounterData();
    }
}

// Get counter data from JSON file (fallback)
function getJsonCounterData() {
    initCounterStorage();
    const data = fs.readFileSync(COUNTER_FILE, 'utf8');
    return JSON.parse(data);
}

// Save counter data
async function saveCounterData(data) {
    // Always update the JSON file for reference/backup
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2));
}

// API endpoint to get current counter
app.get('/api/counter', async (req, res) => {
    try {
        const counterData = await getCounterData();
        res.json(counterData);
    } catch (error) {
        console.error('Error getting counter:', error);
        res.status(500).json({ error: 'Failed to retrieve counter data' });
    }
});

// API endpoint to get next counter number without incrementing
app.get('/api/counter/next', async (req, res) => {
    try {
        const iqamaId = req.query.iqamaId;
        const prescriptionNumber = req.query.prescriptionNumber;
        const deviceId = req.query.deviceId || 'unknown';
        const checkOnly = req.query.checkOnly === 'true';
        
        if (!iqamaId || !prescriptionNumber) {
            return res.status(400).json({
                error: 'Missing required parameters: iqamaId, prescriptionNumber'
            });
        }
        
        // Generate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get current counter data
        const counterData = await getCounterData();
        
        // Find the highest counter value for today only
        let todayCounter = 0;
        Object.values(counterData.counters).forEach(item => {
            // Only consider today's entries when determining the counter
            if (item.date === today) {
                todayCounter = Math.max(todayCounter, item.counter);
            }
        });
        
        // Create a unique key for this combination
        const uniqueKey = `${iqamaId}_${prescriptionNumber}_${today}`;
        
        let counter = 1; // Default start counter
        
        if (useDatabase) {
            try {
                // Check if this combination exists for today
                const existingEntry = await db.findCounterByKeyPattern(`${iqamaId}_${prescriptionNumber}_${today}`);
                
                if (existingEntry) {
                    // If the combination exists, use the existing counter
                    counter = existingEntry.counter;
                } else {
                    // If not, find the highest counter for today
                    const highestCounter = await db.getHighestCounterForDate(today);
                    counter = highestCounter > 0 ? highestCounter + 1 : 1;
                }
            } catch (dbError) {
                console.error('Database error in /api/counter/next:', dbError);
                // Fall back to JSON method if database fails
                counter = await getNextCounterFromJson(iqamaId, prescriptionNumber, today);
            }
        } else {
            // Use JSON file method
            counter = await getNextCounterFromJson(iqamaId, prescriptionNumber, today);
        }
        
        res.json({
            counter,
            iqamaId,
            prescriptionNumber,
            date: today,
            deviceId
        });
    } catch (error) {
        console.error('Error determining next counter:', error);
        res.status(500).json({ error: 'Failed to determine next counter' });
    }
});

// Helper function to get next counter from JSON
async function getNextCounterFromJson(iqamaId, prescriptionNumber, date) {
    // Get all counters
    const data = await getJsonCounterData();
    
    // Create a unique key for this combination
    const uniqueKey = `${iqamaId}_${prescriptionNumber}_${date}`;
    
    // Check if this combination exists for today
    const existingEntry = Object.keys(data.counters)
        .find(key => key.startsWith(uniqueKey));
    
    let counter = 1; // Default start counter
    
    if (existingEntry) {
        // If the combination exists, use the existing counter
        counter = data.counters[existingEntry].counter;
    } else {
        // If not, find the highest counter for today
        const todayEntries = Object.values(data.counters)
            .filter(entry => entry.date === date);
        
        if (todayEntries.length > 0) {
            // Find highest counter number for today
            const highestCounter = Math.max(...todayEntries.map(entry => entry.counter));
            counter = highestCounter + 1;
        }
    }
    
    return counter;
}

// API endpoint to increment counter
app.post('/api/counter/increment', async (req, res) => {
    try {
        const { iqamaId, prescriptionNumber, deviceId, checkOnly } = req.body;
        
        if (!iqamaId || !prescriptionNumber) {
            return res.status(400).json({
                error: 'Missing required parameters: iqamaId, prescriptionNumber'
            });
        }
        
        // Format today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Create a unique key for this combination
        const uniqueKey = `${iqamaId}_${prescriptionNumber}_${today}`;
        
        let counter = 1; // Default start counter
        
        if (useDatabase && !checkOnly) {
            try {
                // Check if this combination exists for today
                const existingEntry = await db.findCounterByKeyPattern(`${iqamaId}_${prescriptionNumber}_${today}`);
                
                if (existingEntry) {
                    // If the combination exists, use the existing counter
                    counter = existingEntry.counter;
                } else {
                    // If not, find the highest counter for today
                    const highestCounter = await db.getHighestCounterForDate(today);
                    counter = highestCounter > 0 ? highestCounter + 1 : 1;
                    
                    // Create a new entry with device ID and timestamp
                    const fullKey = `${uniqueKey}_${deviceId}_${Date.now()}`;
                    await db.saveCounter(fullKey, counter, iqamaId, prescriptionNumber, today, deviceId);
                }
            } catch (dbError) {
                console.error('Database error in /api/counter/increment:', dbError);
                // Fall back to JSON method if database fails
                counter = await incrementCounterInJson(iqamaId, prescriptionNumber, deviceId, today, checkOnly);
            }
        } else {
            // Use JSON file method
            counter = await incrementCounterInJson(iqamaId, prescriptionNumber, deviceId, today, checkOnly);
        }
        
        res.json({
            counter,
            iqamaId,
            prescriptionNumber,
            date: today,
            deviceId
        });
    } catch (error) {
        console.error('Error incrementing counter:', error);
        res.status(500).json({ error: 'Failed to increment counter' });
    }
});

// Helper function to increment counter in JSON
async function incrementCounterInJson(iqamaId, prescriptionNumber, deviceId, date, checkOnly) {
    // Get all counters
    const data = await getJsonCounterData();
    
    // Create a unique key for this combination
    const uniqueKey = `${iqamaId}_${prescriptionNumber}_${date}`;
    
    // Check if this combination exists for today
    const existingEntry = Object.keys(data.counters)
        .find(key => key.startsWith(uniqueKey));
    
    let counter = 1; // Default start counter
    
    if (existingEntry) {
        // If the combination exists, use the existing counter
        counter = data.counters[existingEntry].counter;
    } else {
        // If not, find the highest counter for today
        const todayEntries = Object.values(data.counters)
            .filter(entry => entry.date === date);
        
        if (todayEntries.length > 0) {
            // Find highest counter number for today
            const highestCounter = Math.max(...todayEntries.map(entry => entry.counter));
            counter = highestCounter + 1;
        }
        
        // If not in check-only mode, save the new counter
        if (!checkOnly) {
            // Create a new entry with device ID and timestamp
            const newKey = `${uniqueKey}_${deviceId}_${Date.now()}`;
            data.counters[newKey] = {
                counter,
                iqamaId,
                prescriptionNumber,
                date,
                deviceId,
                timestamp: new Date().toISOString()
            };
            
            // Update lastUpdated timestamp
            data.lastUpdated = new Date().toISOString();
            
            // Save the updated data
            await saveCounterData(data);
        }
    }
    
    return counter;
}

// Start the server
initApp().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Access API at http://localhost:${PORT}/api/counter/next and http://localhost:${PORT}/api/counter/increment`);
    });
}).catch(err => {
    console.error('Failed to initialize app:', err);
    process.exit(1);
});
