import * as jose from 'jose';
import fs from 'fs';

async function generateKeyPair() {
  console.log('Generating RSA key pair for OAuth private_key_jwt authentication...\n');

  // Generate RSA key pair
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true
  });

  // Export keys to PEM format
  const publicKeyPem = await jose.exportSPKI(publicKey);
  const privateKeyPem = await jose.exportPKCS8(privateKey);

  // Save keys to files
  fs.writeFileSync('private-key.pem', privateKeyPem);
  fs.writeFileSync('public-key.pem', publicKeyPem);

  console.log('✓ Key pair generated successfully!');
  console.log('');
  console.log('Files created:');
  console.log('  - private-key.pem (keep this secret!)');
  console.log('  - public-key.pem (upload to Okta)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('1. Copy the public key below (or from public-key.pem):');
  console.log('');
  console.log(publicKeyPem);
  console.log('');
  console.log('2. Register public key in Okta Admin Console:');
  console.log('   a. Go to: Applications → Applications');
  console.log('   b. Find your OAuth app (API Services)');
  console.log('   c. Go to: General → Client Credentials');
  console.log('   d. Click "Edit"');
  console.log('   e. Under "Public Keys", click "Add Key"');
  console.log('   f. Paste the public key above');
  console.log('   g. Click "Save"');
  console.log('');
  console.log('3. The application will automatically use private-key.pem');
  console.log('   (already configured in config.json path: ./private-key.pem)');
  console.log('');
}

generateKeyPair().catch(console.error);
