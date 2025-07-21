// db.js - PostgreSQL database connection and query helpers
// Created: 2025-07-21T23:20:00+05:00
// Description: Database connection and query utilities for print counter persistence

require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false // Required for some PostgreSQL hosts
    }
});

// Initialize the database with required tables
async function initDatabase() {
    try {
        // Create the counter_data table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS counter_data (
                id SERIAL PRIMARY KEY,
                unique_key VARCHAR(255) UNIQUE NOT NULL,
                counter INTEGER NOT NULL,
                iqama_id VARCHAR(100) NOT NULL,
                prescription_number VARCHAR(100) NOT NULL,
                date VARCHAR(20) NOT NULL,
                device_id VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create the metadata table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS metadata (
                key VARCHAR(50) PRIMARY KEY,
                value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Initialize metadata record if it doesn't exist
        const metadataResult = await pool.query(
            'SELECT * FROM metadata WHERE key = $1',
            ['counter_metadata']
        );
        
        if (metadataResult.rows.length === 0) {
            await pool.query(
                'INSERT INTO metadata (key, value) VALUES ($1, $2)',
                ['counter_metadata', JSON.stringify({ last_updated: new Date().toISOString() })]
            );
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Get all counter data
async function getAllCounters() {
    try {
        const result = await pool.query('SELECT * FROM counter_data');
        
        // Format response to match existing JSON structure
        const counters = {};
        result.rows.forEach(row => {
            counters[row.unique_key] = {
                counter: row.counter,
                iqamaId: row.iqama_id,
                prescriptionNumber: row.prescription_number,
                date: row.date,
                deviceId: row.device_id,
                timestamp: row.timestamp
            };
        });
        
        // Get metadata
        const metadataResult = await pool.query(
            'SELECT * FROM metadata WHERE key = $1',
            ['counter_metadata']
        );
        
        const metadata = metadataResult.rows.length > 0 
            ? metadataResult.rows[0].value 
            : { last_updated: new Date().toISOString() };
        
        return {
            counters,
            lastUpdated: metadata.last_updated
        };
    } catch (error) {
        console.error('Error getting all counters:', error);
        throw error;
    }
}

// Get the highest counter value for a specific date
async function getHighestCounterForDate(date) {
    try {
        const result = await pool.query(
            'SELECT MAX(counter) as highest_counter FROM counter_data WHERE date = $1',
            [date]
        );
        
        return result.rows[0].highest_counter || 0;
    } catch (error) {
        console.error('Error getting highest counter for date:', error);
        throw error;
    }
}

// Find a counter by unique key pattern
async function findCounterByKeyPattern(keyPattern) {
    try {
        const result = await pool.query(
            'SELECT * FROM counter_data WHERE unique_key LIKE $1',
            [`${keyPattern}%`]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error finding counter by key pattern:', error);
        throw error;
    }
}

// Save or update a counter
async function saveCounter(uniqueKey, counterValue, iqamaId, prescriptionNumber, date, deviceId) {
    try {
        // Check if the counter already exists
        const existingResult = await pool.query(
            'SELECT * FROM counter_data WHERE unique_key = $1',
            [uniqueKey]
        );
        
        if (existingResult.rows.length > 0) {
            // Update existing counter
            await pool.query(
                `UPDATE counter_data 
                SET timestamp = CURRENT_TIMESTAMP
                WHERE unique_key = $1`,
                [uniqueKey]
            );
        } else {
            // Insert new counter
            await pool.query(
                `INSERT INTO counter_data 
                (unique_key, counter, iqama_id, prescription_number, date, device_id)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [uniqueKey, counterValue, iqamaId, prescriptionNumber, date, deviceId]
            );
        }
        
        // Update metadata
        await pool.query(
            `UPDATE metadata 
            SET value = jsonb_set(value, '{last_updated}', $1::jsonb), 
                updated_at = CURRENT_TIMESTAMP
            WHERE key = $2`,
            [JSON.stringify(new Date().toISOString()), 'counter_metadata']
        );
    } catch (error) {
        console.error('Error saving counter:', error);
        throw error;
    }
}

module.exports = {
    pool,
    initDatabase,
    getAllCounters,
    getHighestCounterForDate,
    findCounterByKeyPattern,
    saveCounter
};
