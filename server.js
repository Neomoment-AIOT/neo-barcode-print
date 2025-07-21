// server.js - Simple Node.js server for barcode print counter
// Created: 2025-07-21T16:38:14+05:00
// Updated: 2025-07-21T23:37:00+05:00 - Added PostgreSQL support for production
// Description: Handles print counter storage and retrieval via database or JSON

require('dotenv').config();
const express = require('express');
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

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV;
// 2025-07-22T01:05:34+05:00: Removed file fallback logic, always use database
const useDatabase = true;

// Initialize the app
// 2025-07-21T23:52:45+05:00: Removed database initialization as it's now handled by init_db.js script
// 2025-07-22T01:05:34+05:00: Removed JSON fallback logic, always use database
async function initApp() {
    // Database initialization is now handled by the standalone init_db.js script
    console.log('Using PostgreSQL database for counter storage');
    
    // Verify database connection without initializing tables
    try {
        const client = await db.pool.connect();
        console.log('Database connection verified successfully');
        client.release();
    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error('Database connection failed. Please check your database configuration.');
    }
}

// 2025-07-22T01:05:34+05:00: Removed JSON file initialization function

// Get counter data
// 2025-07-22T01:05:34+05:00: Removed JSON fallback, always use database
async function getCounterData() {
    try {
        return await db.getAllCounters();
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to retrieve counter data from database');
    }
}

// 2025-07-22T01:05:34+05:00: Removed JSON file save function

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
// 2025-07-22T01:10:55+05:00: Fixed syntax errors and simplified endpoint logic
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
        
        // Default counter value
        let counter = 1;
        
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
            
            // Return counter information
            res.json({
                counter,
                iqamaId,
                prescriptionNumber,
                date: today,
                deviceId
            });
            
        } catch (dbError) {
            console.error('Database error in /api/counter/next:', dbError);
            res.status(500).json({ error: 'Database error. Failed to retrieve counter.' });
        }
    } catch (error) {
        console.error('Error determining next counter:', error);
        res.status(500).json({ error: 'Failed to determine next counter' });
    }
});

// API endpoint to increment counter
app.post('/api/counter/increment', async (req, res) => {
    try {
        const { iqamaId, prescriptionNumber, deviceId = 'unknown', checkOnly = false } = req.body;
        
        if (!iqamaId || !prescriptionNumber) {
            return res.status(400).json({
                error: 'Missing required parameters: iqamaId, prescriptionNumber'
            });
        }
        
        // Generate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Create a unique key for this request
        const uniqueKey = `${iqamaId}_${prescriptionNumber}_${today}`;
        
        // Determine next counter value
        let counter = 1; // Default counter value for new entries
        let isNewEntry = true;
        
        try {
            // Check if this combination exists for today
            const existingEntry = await db.findCounterByKeyPattern(uniqueKey);
            
            if (existingEntry) {
                // Use existing counter value
                counter = existingEntry.counter;
                isNewEntry = false;
            } else {
                // Get highest counter for today and increment
                const highestCounter = await db.getHighestCounterForDate(today);
                counter = highestCounter > 0 ? highestCounter + 1 : 1;
                
                // Only create a new entry if not just checking
                // 2025-07-22T01:25:00+05:00: Fixed function call from createCounter to saveCounter
                if (!checkOnly) {
                    await db.saveCounter(uniqueKey, counter, iqamaId, prescriptionNumber, today, deviceId);
                }
            }
        } catch (dbError) {
            console.error('Database error in /api/counter/increment:', dbError);
            return res.status(500).json({ error: 'Database error. Failed to increment counter.' });
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
