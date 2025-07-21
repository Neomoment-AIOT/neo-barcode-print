// Test API endpoints directly
// Created: 2025-07-22T01:37:00+05:00
// Updated: 2025-07-22T01:38:00+05:00 - Use native Node.js http instead of node-fetch

const http = require('http');

async function testAPI() {
    try {
        console.log('=== TESTING API ENDPOINTS ===');
        
        // Test the exact call the frontend makes
        const testData = {
            iqamaId: '43534534534',
            prescriptionNumber: '345345345545',
            deviceId: 'test-device',
            checkOnly: true
        };
        
        console.log('1. Testing POST /api/counter/increment with checkOnly=true');
        console.log('Request data:', testData);
        
        const postData = JSON.stringify(testData);
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/counter/increment',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error('API Error:', res.statusCode, data);
                    return;
                }
                
                const result = JSON.parse(data);
                console.log('API Response:', result);
                console.log('Expected counter: 5 (highest 4 + 1)');
                console.log('Actual counter:', result.counter);
                
                if (result.counter === 1) {
                    console.log('\n🔍 ISSUE FOUND: Counter is 1 instead of 5!');
                } else if (result.counter === 5) {
                    console.log('\n✅ Counter logic is working correctly');
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error.message);
        });
        
        req.write(postData);
        req.end();
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testAPI();
