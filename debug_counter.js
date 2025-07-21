// Debug script to test counter logic
// Created: 2025-07-22T01:36:00+05:00

require('dotenv').config();
const db = require('./db');

async function debugCounterLogic() {
    try {
        console.log('=== COUNTER DEBUG TEST ===');
        
        // Get current date
        const today = new Date().toISOString().split('T')[0];
        console.log('1. Current date:', today);
        
        // Get all counter data
        console.log('\n2. All counter data:');
        const allCounters = await db.getAllCounters();
        console.table(allCounters.counters || []);
        
        // Test the highest counter function
        console.log('\n3. Testing getHighestCounterForDate:');
        const highestCounter = await db.getHighestCounterForDate(today);
        console.log('Highest counter for today:', highestCounter);
        
        // Test with specific date from DB
        const highestCounterOld = await db.getHighestCounterForDate('2025-07-21');
        console.log('Highest counter for 2025-07-21:', highestCounterOld);
        
        // Test findCounterByKeyPattern
        console.log('\n4. Testing findCounterByKeyPattern:');
        const testKey = '43534534534_345345345545_2025-07-21';
        const foundEntry = await db.findCounterByKeyPattern(testKey);
        console.log('Found entry for key pattern:', foundEntry);
        
        process.exit(0);
    } catch (error) {
        console.error('Debug error:', error);
        process.exit(1);
    }
}

debugCounterLogic();
