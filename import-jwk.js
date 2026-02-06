import * as jose from 'jose';
import fs from 'fs';

async function importJWK() {
  // Your private key in JWK format
  const privateJWK = {
    "kty": "RSA",
    "use": "sig",
    "kid": "LtTPIsYKhik133-pBd1enP349zH8amJFlhdw159sUh0",
    "n": "pKLhKHYn9zDDibPbE-BDGSXC3uDKA0Fn0FMURUkm4wcJa4c11BoIjJBkwDbFLYfb-WLbiInxvpRQZEcSSG7Bah8waCG23ce68SBbMzYQvnqzW6S3N0aQwftbzAXIFr8tVSRKHo7nbxxBH54-FW_mW3WChTcoRDCKCZmLD8nEeEkoDV91d1taMXjnLTd_XXqV-aoHyUWkz83caShhLSKpHm0yZF4kpN9aT9eex2RVF6_jQ3zD8gPg8UCmKnLWAh82QOCslMTJrLoAe4BF7T1MU_tlsAUK8MrLs-aYox_ScF6UeCfl1YXLbh9iRWNccF_UsqfwTbpdfK1E0DOZSzAapQ",
    "e": "AQAB",
    "d": "FLf4vOZNtkJ5QSGUvuYYm5gQc4r3cTxwa5ug7-06SxTOHy2XXRdfnwzm2PerjcTMrpA9z2uItDKnAU-eYeYqSggdx-UCRdvGT2UChSnXJpl7a9uJQRgMzJSs4zqRCSfK9S2JdFoIjwePvIJmDr2T0Euz_r7HvvkazgV4Jib-piJfDHSx7-XvBMEDOJBtj-dju-l5frUVIC5s54t8vE7brcijfhmAzpsRNu0V3xOZz-7v1PMwYCJpoJDhSYmEtdoGfYDLivrpMVfVxRHQhCmDuItjb7ZFRathbjdCvL66wXHTa-5-fw0IptnjGVKJCntyEPrHdBHjJL9L20Epv9xKKw",
    "p": "0beAC13C83NIPMncZAkIGTQLMMx3pEDQPCUgl7VYkvwTWU2_OICBjk2-A39S0F09I21mhZNQ6ueA5Rg3_B3e-pOTeorXt5oIZnjUgflqLN0qYysU8vLXUSA5xXs8KTst-NDWcCD0IKMtQ5olv3vmovGgtJb1zZlGYagzVHaYqlc",
    "q": "yPhvhQYnJ9HSXiL9jJVeRrjzJYMoXSxAd6a1ge2BLLIWBIVi2RSOOXRVFb5gjIycQbm3SHabMStdZNbbYX4bgKV0hXcINZ8CBaDI3MzqXBkuiHfRMbXTWYBE869s20D_ee-8iJN60M3wna1I_k97dXA8l7Rt5H-UfzjqxhQ8vWM",
    "dp": "KuR5D9oRcXF2qNgwd1VRjrYSQ9zN645GCMcfL2grwYRFANLh9VBzLwO_hT-ZVHx9cK2DdnZ26lSHDFQzvyDs5hsg4sNa83ZRmYPFEwBMMvjZHodFNZttZm5M4pMd7uDnuigcc7qJs9MsAtOYPN2-gj0hPU5S38Ylmvun4_KNruk",
    "dq": "tbWrX6OIk8BrbSJGDm6fp2JitnA4dsYkJAtf4fJU8Yyzy7KvBYhIcDp3FAnmUi5wuhypU6Op_nMvJpX-FdBoHZF8IZDWo2T59wzBkKLW5B8Aq_Np-oBkcHBB5_OdgUDrvdy9ot92FIWgIXEkpoxHHJA2uRQyqH-STNWxsRdrM_E",
    "qi": "MK51HLds4QBjKlRhCHgyMNHz47_5iJv4YZhROzuiZCtlGiyU_3yy9Hm9gNfO6CQIhEOHKjpLeymPR0N78GpDyO5FNtToFbJKsO0izqWCy-8pJKNXzMD34OtpKa9GiLoszOaBXr6oeHL2JNP3mnKEAMAB4Y6yZ-xe_h5Xl7Bf5HU"
  };

  const publicJWK = {
    "kty": "RSA",
    "use": "sig",
    "kid": "LtTPIsYKhik133-pBd1enP349zH8amJFlhdw159sUh0",
    "n": "pKLhKHYn9zDDibPbE-BDGSXC3uDKA0Fn0FMURUkm4wcJa4c11BoIjJBkwDbFLYfb-WLbiInxvpRQZEcSSG7Bah8waCG23ce68SBbMzYQvnqzW6S3N0aQwftbzAXIFr8tVSRKHo7nbxxBH54-FW_mW3WChTcoRDCKCZmLD8nEeEkoDV91d1taMXjnLTd_XXqV-aoHyUWkz83caShhLSKpHm0yZF4kpN9aT9eex2RVF6_jQ3zD8gPg8UCmKnLWAh82QOCslMTJrLoAe4BF7T1MU_tlsAUK8MrLs-aYox_ScF6UeCfl1YXLbh9iRWNccF_UsqfwTbpdfK1E0DOZSzAapQ",
    "e": "AQAB"
  };

  console.log('Converting JWK to PEM format...\n');

  // Import the private key with extractable flag
  const privateKey = await jose.importJWK(privateJWK, 'RS256', { extractable: true });
  const publicKey = await jose.importJWK(publicJWK, 'RS256', { extractable: true });

  // Export to PEM format
  const privateKeyPem = await jose.exportPKCS8(privateKey);
  const publicKeyPem = await jose.exportSPKI(publicKey);

  // Save to files
  fs.writeFileSync('private-key.pem', privateKeyPem);
  fs.writeFileSync('public-key.pem', publicKeyPem);

  console.log('✓ Keys converted and saved successfully!');
  console.log('');
  console.log('Files created:');
  console.log('  - private-key.pem (your private key)');
  console.log('  - public-key.pem (your public key)');
  console.log('');
  console.log('The application is now ready to use private_key_jwt authentication.');
}

importJWK().catch(console.error);
