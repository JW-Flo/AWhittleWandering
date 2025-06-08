const crypto = require('crypto');

async function testEndpoint() {
    const body = { latitude: 37.7749, longitude: -122.4194 };
    const bodyStr = JSON.stringify(body);
    const key = 'test-key';
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(Buffer.from(bodyStr, 'utf8'));
    const signature = 'sha256=' + hmac.digest('hex');

    console.log('Testing endpoint with:');
    console.log('Body:', bodyStr);
    console.log('Signature:', signature);
    console.log('\nExecute this curl command:');
    console.log(`curl -X POST https://continentalusa-edge.kd8jc7v8cd.workers.dev/weather-risk \\
  -H "Content-Type: application/json" \\
  -H "x-signature: ${signature}" \\
  -d '${bodyStr}'`);
}

testEndpoint();
