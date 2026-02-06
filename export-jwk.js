import * as jose from 'jose';
import fs from 'fs';

async function exportToJWK() {
  // Read the public key PEM file
  const publicKeyPem = fs.readFileSync('public-key.pem', 'utf8');

  // Import the public key
  const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');

  // Export to JWK format
  const jwk = await jose.exportJWK(publicKey);

  // Add key use and algorithm
  jwk.use = 'sig';
  jwk.alg = 'RS256';
  jwk.kid = `key-${Date.now()}`;

  console.log('Public Key in JWK format (copy this JSON):');
  console.log('');
  console.log(JSON.stringify(jwk, null, 2));
  console.log('');

  // Also save to file
  fs.writeFileSync('public-key.jwk.json', JSON.stringify(jwk, null, 2));
  console.log('✓ JWK saved to: public-key.jwk.json');
}

exportToJWK().catch(console.error);
