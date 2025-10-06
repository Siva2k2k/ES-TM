const http = require('http');

console.log('Testing backend API endpoints...\n');

// Test the dashboard-stats endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/billing/invoices/dashboard-stats',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // Add a mock auth token if needed
    'Authorization': 'Bearer mock-token'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:');
    console.log(data);
    
    try {
      const json = JSON.parse(data);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
      console.log('Response is not valid JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();