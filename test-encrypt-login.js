const crypto = require('crypto');
const http = require('http');

const secret = 'super_secret_comm_key_123!';
const key = crypto.createHash('sha256').update(secret).digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return {
    iv: iv.toString('base64'),
    data: encrypted
  };
}

function decrypt(ivBase64, dataBase64) {
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(dataBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const payload = {
  email: "admin@hukuk.ai",
  password: "Admin123!"
};

const encryptedPayload = encrypt(JSON.stringify(payload));
const postData = JSON.stringify(encryptedPayload);

console.log("Sending Encrypted Request:", postData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    console.log("Raw Response received:", rawData);
    try {
      const json = JSON.parse(rawData);
      if (json.iv && json.data) {
        const decryptedStr = decrypt(json.iv, json.data);
        console.log("De-serialized Decrypted Response:", JSON.parse(decryptedStr));
      } else {
        console.log("Unencrypted JSON:", json);
      }
    } catch (e) {
      console.log("Failed to parse/decrypt response:", e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
