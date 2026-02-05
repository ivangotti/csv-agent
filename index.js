import okta from '@okta/okta-sdk-nodejs';
const { Client } = okta;
import { getConfig, saveConfig, selectCsvFile } from './config.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Find all CSV files in the current directory
 */
function findCsvFiles() {
  const files = fs.readdirSync('.');
  return files.filter(file => file.endsWith('.csv'));
}

/**
 * Check if an application exists by name
 */
async function findAppByName(config, appName) {
  try {
    const response = await fetch(
      `https://${config.oktaDomain}/api/v1/apps?q=${encodeURIComponent(appName)}`,
      {
        headers: {
          'Authorization': `SSWS ${config.apiToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search apps: ${response.statusText}`);
    }

    const apps = await response.json();
    return apps.find(app => app.label === appName);
  } catch (error) {
    throw new Error(`Error searching for app: ${error.message}`);
  }
}

/**
 * Create a SAML 2.0 application
 */
async function createSamlApp(config, appName) {
  const appDefinition = {
    label: appName,
    visibility: {
      autoSubmitToolbar: false,
      hide: {
        iOS: false,
        web: false
      }
    },
    features: [],
    signOnMode: 'SAML_2_0',
    settings: {
      signOn: {
        defaultRelayState: '',
        ssoAcsUrl: 'https://example.com/sso/saml',
        idpIssuer: 'http://www.okta.com/${org.externalKey}',
        audience: `https://example.com/${appName}`,
        recipient: 'https://example.com/sso/saml',
        destination: 'https://example.com/sso/saml',
        subjectNameIdTemplate: '${user.userName}',
        subjectNameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        responseSigned: true,
        assertionSigned: true,
        signatureAlgorithm: 'RSA_SHA256',
        digestAlgorithm: 'SHA256',
        honorForceAuthn: true,
        authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
      }
    }
  };

  try {
    const response = await fetch(
      `https://${config.oktaDomain}/api/v1/apps`,
      {
        method: 'POST',
        headers: {
          'Authorization': `SSWS ${config.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appDefinition)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create app: ${response.statusText} - ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error creating app: ${error.message}`);
  }
}

/**
 * Read CSV file and extract column headers
 */
function getCsvColumns(csvFilePath) {
  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    // Parse CSV to get headers only (read first 2 lines - header + 1 data row)
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      to_line: 2  // Read header line + first data row
    });

    // Get column names from the parsed data
    const columns = Object.keys(records[0] || {});

    // Filter out columns starting with "ent_"
    return columns.filter(col => !col.startsWith('ent_'));
  } catch (error) {
    throw new Error(`Error reading CSV file: ${error.message}`);
  }
}

/**
 * Read CSV file and extract column headers with details
 */
function getCsvColumnsWithDetails(csvFilePath) {
  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    // Parse CSV to get headers only (read first 2 lines - header + 1 data row)
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      to_line: 2  // Read header line + first data row
    });

    // Get column names from the parsed data
    const allColumns = Object.keys(records[0] || {});

    // Separate included and excluded columns
    const included = allColumns.filter(col => !col.startsWith('ent_'));
    const excluded = allColumns.filter(col => col.startsWith('ent_'));

    return {
      total: allColumns.length,
      included: included,
      excluded: excluded
    };
  } catch (error) {
    throw new Error(`Error reading CSV file: ${error.message}`);
  }
}

/**
 * Get current app user schema
 */
async function getAppUserSchema(config, appId) {
  try {
    const response = await fetch(
      `https://${config.oktaDomain}/api/v1/meta/schemas/apps/${appId}/default`,
      {
        headers: {
          'Authorization': `SSWS ${config.apiToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get app user schema: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error getting app user schema: ${error.message}`);
  }
}

/**
 * Create a custom attribute in app user schema
 */
async function createCustomAttribute(config, appId, attributeName) {
  const customAttributeDefinition = {
    definitions: {
      custom: {
        id: '#custom',
        type: 'object',
        properties: {
          [attributeName]: {
            title: attributeName,
            description: `Custom attribute: ${attributeName}`,
            type: 'string',
            scope: 'NONE',
            master: {
              type: 'PROFILE_MASTER'
            }
          }
        },
        required: []
      }
    }
  };

  try {
    const response = await fetch(
      `https://${config.oktaDomain}/api/v1/meta/schemas/apps/${appId}/default`,
      {
        method: 'POST',
        headers: {
          'Authorization': `SSWS ${config.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customAttributeDefinition)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create custom attribute: ${response.statusText} - ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error creating custom attribute: ${error.message}`);
  }
}

/**
 * Process CSV columns and create custom attributes
 */
async function processCustomAttributes(config, appId, csvFilePath) {
  // Get CSV columns
  const allColumns = getCsvColumnsWithDetails(csvFilePath);
  const columns = allColumns.included;
  const excludedColumns = allColumns.excluded;

  console.log(`   ✓ CSV parsed successfully`);
  console.log(`   → Total columns found: ${allColumns.total}`);

  if (excludedColumns.length > 0) {
    console.log(`   → Excluded columns (ent_*): ${excludedColumns.length}`);
    excludedColumns.forEach(col => console.log(`     • ${col} (skipped)`));
  }

  console.log(`   → Columns to process: ${columns.length}`);
  if (columns.length > 0) {
    columns.forEach(col => console.log(`     • ${col}`));
  }
  console.log('');

  if (columns.length === 0) {
    console.log('   ℹ No columns to process (all columns start with "ent_")');
    return;
  }

  // Get existing schema
  console.log('   → Fetching current app user schema from Okta...');
  console.log(`   → API Call: GET /api/v1/meta/schemas/apps/${appId}/default`);
  const schema = await getAppUserSchema(config, appId);

  const existingAttributes = schema.definitions?.custom?.properties || {};
  const existingAttributeNames = Object.keys(existingAttributes);

  console.log(`   ✓ Schema retrieved successfully`);
  console.log(`   → Existing custom attributes: ${existingAttributeNames.length}`);

  if (existingAttributeNames.length > 0) {
    console.log('   → Current attributes:');
    existingAttributeNames.forEach(attr => console.log(`     • ${attr}`));
  }
  console.log('');

  // Determine which attributes need to be created
  const attributesToCreate = columns.filter(col => !existingAttributeNames.includes(col));
  const attributesAlreadyExist = columns.filter(col => existingAttributeNames.includes(col));

  if (attributesAlreadyExist.length > 0) {
    console.log(`   ✓ ${attributesAlreadyExist.length} attribute(s) already exist (skipping):`);
    attributesAlreadyExist.forEach(attr => console.log(`     • ${attr}`));
    console.log('');
  }

  if (attributesToCreate.length === 0) {
    console.log('   ✓ All required attributes already exist');
    console.log('   → No new attributes need to be created');
    return;
  }

  console.log(`   → Creating ${attributesToCreate.length} new custom attribute(s)...`);
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (const attributeName of attributesToCreate) {
    try {
      console.log(`   → Creating attribute: "${attributeName}"`);
      console.log(`     API Call: POST /api/v1/meta/schemas/apps/${appId}/default`);
      await createCustomAttribute(config, appId, attributeName);
      console.log(`     ✓ Successfully created`);
      successCount++;
    } catch (error) {
      console.error(`     ✗ Failed: ${error.message}`);
      failureCount++;
    }
    console.log('');
  }

  console.log('   📊 Custom Attribute Summary:');
  console.log(`     • Total columns in CSV: ${allColumns.total}`);
  console.log(`     • Excluded (ent_*): ${excludedColumns.length}`);
  console.log(`     • Already existed: ${attributesAlreadyExist.length}`);
  console.log(`     • Successfully created: ${successCount}`);
  if (failureCount > 0) {
    console.log(`     • Failed to create: ${failureCount}`);
  }
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('  CSV Agent - Okta SAML Application Automation');
    console.log('='.repeat(70));
    console.log('');

    // Get configuration (from file or prompt user)
    console.log('📋 STEP 1: Loading Configuration');
    console.log('   → Checking for existing configuration file (config.json)...');
    let config = await getConfig();
    console.log('   ✓ Configuration loaded successfully');
    console.log(`   ✓ Connected to Okta tenant: ${config.oktaDomain}`);
    console.log('');

    // Find CSV files in current directory
    console.log('📂 STEP 2: CSV File Discovery');
    console.log('   → Scanning current directory for .csv files...');
    const csvFiles = findCsvFiles();

    if (csvFiles.length === 0) {
      console.log('   ✗ No CSV files found in the current directory.');
      console.log('');
      console.log('💡 TIP: Place a CSV file in the current directory and run again.');
      console.log('   The CSV filename will be used as the application name in Okta.');
      process.exit(0);
    }

    // Determine which CSV file to process
    let selectedCsvFile;

    if (csvFiles.length === 1) {
      // Only one CSV file, use it automatically
      selectedCsvFile = csvFiles[0];
      console.log(`   ✓ Found 1 CSV file: ${selectedCsvFile}`);
      console.log('   → Automatically selected for processing');
    } else {
      // Multiple CSV files found
      console.log(`   ✓ Found ${csvFiles.length} CSV files:`);
      csvFiles.forEach(file => console.log(`     • ${file}`));
      console.log('');

      // Check if there's a saved selection
      if (config.selectedCsvFile && csvFiles.includes(config.selectedCsvFile)) {
        selectedCsvFile = config.selectedCsvFile;
        console.log('   → Using previously selected file from configuration');
        console.log(`   ✓ Selected: ${selectedCsvFile}`);
        console.log('');
        console.log('   💡 TIP: To change selection, delete config.json and run again');
      } else {
        console.log('   → No saved selection found, prompting for user input...');
        selectedCsvFile = await selectCsvFile(csvFiles);

        // Save selection to config
        config.selectedCsvFile = selectedCsvFile;
        await saveConfig(config);
        console.log('   ✓ Selection saved to configuration file');
      }
    }
    console.log('');

    // Process the selected CSV file
    const appName = path.basename(selectedCsvFile, '.csv');
    console.log('🔧 STEP 3: Application Processing');
    console.log(`   → CSV File: ${selectedCsvFile}`);
    console.log(`   → Application Name: "${appName}"`);
    console.log('');

    // Check if app exists
    console.log('   → Querying Okta API to check if application exists...');
    console.log(`   → API Call: GET /api/v1/apps?q=${encodeURIComponent(appName)}`);
    const existingApp = await findAppByName(config, appName);

    let app;
    if (existingApp) {
      console.log('   ✓ Application found in Okta!');
      console.log('');
      console.log('   📊 Application Details:');
      console.log(`     • App ID: ${existingApp.id}`);
      console.log(`     • Status: ${existingApp.status}`);
      console.log(`     • Sign-On Mode: ${existingApp.signOnMode}`);
      console.log('');
      console.log('   → Skipping application creation (already exists)');
      app = existingApp;
    } else {
      console.log('   ℹ Application does not exist in Okta');
      console.log('   → Preparing SAML 2.0 application definition...');
      console.log('   → API Call: POST /api/v1/apps');
      console.log('');
      const newApp = await createSamlApp(config, appName);
      console.log('   ✓ Application created successfully!');
      console.log('');
      console.log('   📊 New Application Details:');
      console.log(`     • App ID: ${newApp.id}`);
      console.log(`     • Name: ${newApp.label}`);
      console.log(`     • Status: ${newApp.status}`);
      console.log(`     • Sign-On Mode: ${newApp.signOnMode}`);
      console.log('');
      console.log('   💡 NOTE: SAML settings use placeholder values.');
      console.log('   Update SSO URLs and audience in Okta Admin Console.');
      app = newApp;
    }
    console.log('');

    // Process custom attributes from CSV columns
    console.log('🏷️  STEP 4: Custom Attribute Management');
    console.log('   → Reading CSV column headers...');
    console.log('   → Filtering out enterprise columns (starting with "ent_")...');
    await processCustomAttributes(config, app.id, selectedCsvFile);

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ Processing Complete!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📍 Next Steps:');
    console.log('   1. Login to Okta Admin Console');
    console.log(`   2. Navigate to Applications → ${appName}`);
    console.log('   3. Configure SAML settings (SSO URLs, Audience, etc.)');
    console.log('   4. Review custom attributes under Provisioning → To App');
    console.log('');

  } catch (error) {
    console.log('');
    console.error('❌ ERROR:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   • Check your Okta domain and API token are correct');
    console.log('   • Verify API token has application management permissions');
    console.log('   • Ensure CSV file is properly formatted');
    console.log('   • Check network connectivity to Okta');
    console.log('');
    process.exit(1);
  }
}

main();
