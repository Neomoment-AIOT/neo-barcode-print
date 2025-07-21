// init_db.js - Standalone Database Initialization Script
// Created: 2025-07-21T23:52:30+05:00
// Description: Initializes the required database tables without running the app

require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool using credentials from .env
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
async function initializeDatabase() {
    try {
        console.log('Connecting to database...');
        
        // Test connection
        const clientTest = await pool.connect();
        console.log('Database connection successful.');
        clientTest.release();
        
        // Create the counter_data table if it doesn't exist
        console.log('Creating counter_data table...');
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
        console.log('counter_data table created successfully.');
        
        // Create the metadata table if it doesn't exist
        console.log('Creating metadata table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS metadata (
                key VARCHAR(50) PRIMARY KEY,
                value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('metadata table created successfully.');
        
        // Initialize metadata record if it doesn't exist
        console.log('Initializing counter metadata...');
        const metadataResult = await pool.query(
            'SELECT * FROM metadata WHERE key = $1',
            ['counter_metadata']
        );
        
        if (metadataResult.rows.length === 0) {
            // Create initial metadata if not exists
            await pool.query(
                'INSERT INTO metadata (key, value) VALUES ($1, $2)',
                [
                    'counter_metadata',
                    JSON.stringify({
                        last_updated: new Date().toISOString(),
                        current_date: new Date().toISOString().split('T')[0],
                        daily_counter: 0,
                        total_counter: 0
                    })
                ]
            );
            console.log('Counter metadata initialized successfully.');
        } else {
            console.log('Counter metadata already exists.');
        }
        
        // Count existing records
        const countResult = await pool.query('SELECT COUNT(*) FROM counter_data');
        console.log(`Database currently contains ${countResult.rows[0].count} counter records.`);
        
        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    } finally {
        // Close the pool
        await pool.end();
        console.log('Database connection pool closed.');
    }
}

// Run the initialization
initializeDatabase().then(() => {
    console.log('Script execution completed.');
});
