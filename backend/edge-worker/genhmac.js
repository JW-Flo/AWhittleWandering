const crypto = require('crypto');
const body = { latitude: 37.7749, longitude: -122.4194 };
const key = 'test-key';
const hmac = crypto.createHmac('sha256', key);
hmac.update(JSON.stringify(body));
console.log('sha256=' + hmac.digest('hex'));
