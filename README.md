# CSV Agent - Okta API Integration

A Node.js application for interacting with Okta APIs with automatic configuration management.

## Prerequisites

- Node.js 18.x or higher
- An Okta account with API access
- Okta API token with appropriate permissions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Okta Credentials

The application will automatically prompt for configuration on first run. You'll need:

- **Okta Tenant URL**: Your Okta domain
  - Examples: `your-tenant.okta.com` or `https://your-tenant.okta.com`
  - The app accepts domains with or without `https://` protocol
  - Must end with `.okta.com` or `.oktapreview.com`
  - Find this in your Okta admin console URL
  - The app will validate and normalize the domain automatically

- **API Token**: An Okta API token with appropriate permissions
  - Generate in Okta Admin Console: Security → API → Tokens
  - Needs application management permissions

The configuration will be saved to `config.json` for future runs.

#### Manual Configuration (Optional)

Alternatively, create a `config.json` file manually:
```json
{
  "oktaDomain": "your-tenant.okta.com",
  "apiToken": "your-api-token",
  "selectedCsvFile": "My Application.csv"
}
```

Note: All configuration (Okta credentials and CSV file selection) is stored in the same `config.json` file.

## Usage

### Run the Application

```bash
npm start
```

On first run, you'll be prompted to enter your Okta credentials:
```
Configuration file not found. Please provide the following information:

Okta Tenant URL (e.g., your-tenant.okta.com): your-tenant.okta.com
Okta API Token: 00abc...xyz

Configuration saved to ./config.json
```

### Development Mode

For development with auto-reload on file changes:
```bash
npm run dev
```

## What It Does

The application automates SAML 2.0 application creation and custom attribute management in Okta:

1. **CSV File Discovery**: Scans the current directory for `.csv` files
2. **File Selection**: If multiple CSV files exist, prompts you to select one (saves selection for future runs)
3. **App Name Extraction**: Uses the CSV filename (without extension) as the app name/label
4. **Existence Check**: Queries Okta to see if an app with that name already exists
5. **App Creation**: If the app doesn't exist, creates a new SAML 2.0 application
6. **Custom Attributes**: Creates custom attributes based on CSV column headers
   - Reads column names from the CSV file
   - Filters out columns starting with `ent_` (enterprise columns)
   - Creates custom app user attributes for each remaining column
   - Checks existing attributes to avoid duplicates
7. **Confirmation**: Displays the app ID, status, and custom attributes created

### Example Usage

#### Single CSV File

Place a CSV file in the current directory:
```bash
touch "My Application.csv"
```

Run the application:
```bash
npm start
```

Example output:
```
======================================================================
  CSV Agent - Okta SAML Application Automation
======================================================================

📋 STEP 1: Loading Configuration
   → Checking for existing configuration file (config.json)...
   ✓ Configuration loaded successfully
   ✓ Connected to Okta tenant: your-tenant.okta.com

📂 STEP 2: CSV File Discovery
   → Scanning current directory for .csv files...
   ✓ Found 1 CSV file: My Application.csv
   → Automatically selected for processing

🔧 STEP 3: Application Processing
   → CSV File: My Application.csv
   → Application Name: "My Application"

   → Querying Okta API to check if application exists...
   → API Call: GET /api/v1/apps?q=My%20Application
   ℹ Application does not exist in Okta
   → Preparing SAML 2.0 application definition...
   → API Call: POST /api/v1/apps

   ✓ Application created successfully!

   📊 New Application Details:
     • App ID: 0oa1b2c3d4e5f6g7h8i9
     • Name: My Application
     • Status: ACTIVE
     • Sign-On Mode: SAML_2_0

   💡 NOTE: SAML settings use placeholder values.
   Update SSO URLs and audience in Okta Admin Console.

🏷️  STEP 4: Custom Attribute Management
   → Reading CSV column headers...
   → Filtering out enterprise columns (starting with "ent_")...
   ✓ CSV parsed successfully
   → Total columns found: 6
   → Excluded columns (ent_*): 1
     • ent_InternalID (skipped)
   → Columns to process: 5
     • Username
     • firstName
     • lastName
     • email
     • department

   → Fetching current app user schema from Okta...
   → API Call: GET /api/v1/meta/schemas/apps/0oa1b2c3d4e5f6g7h8i9/default
   ✓ Schema retrieved successfully
   → Existing custom attributes: 0

   → Creating 5 new custom attribute(s)...

   → Creating attribute: "Username"
     API Call: POST /api/v1/meta/schemas/apps/0oa1b2c3d4e5f6g7h8i9/default
     ✓ Successfully created

   → Creating attribute: "firstName"
     API Call: POST /api/v1/meta/schemas/apps/0oa1b2c3d4e5f6g7h8i9/default
     ✓ Successfully created

   [...]

   📊 Custom Attribute Summary:
     • Total columns in CSV: 6
     • Excluded (ent_*): 1
     • Already existed: 0
     • Successfully created: 5

======================================================================
✅ Processing Complete!
======================================================================

📍 Next Steps:
   1. Login to Okta Admin Console
   2. Navigate to Applications → My Application
   3. Configure SAML settings (SSO URLs, Audience, etc.)
   4. Review custom attributes under Provisioning → To App
```

#### Multiple CSV Files

If you have multiple CSV files, the app will prompt you to select one:
```
Connected to Okta successfully!

Looking for CSV files in current directory...

Found 3 CSV file(s):

  - App One.csv
  - App Two.csv
  - App Three.csv

Multiple CSV files found. Please select which one to process:

  1. App One.csv
  2. App Two.csv
  3. App Three.csv

Enter the number (1-3): 2

Selection saved to configuration.

--- Processing: App Two.csv ---
App Name/Label: App Two
Checking if app already exists...
App does not exist. Creating SAML 2.0 application...
✓ App created successfully!
  App ID: 0oa1b2c3d4e5f6g7h8i9
  Name: App Two
  Status: ACTIVE
  Sign-On Mode: SAML_2_0

--- Processing Complete ---
```

On subsequent runs, it will use your saved selection:
```
Found 3 CSV file(s):

  - App One.csv
  - App Two.csv
  - App Three.csv

Using previously selected file: App Two.csv
(To change selection, delete config.json and run again)
```

## Project Structure

```
├── index.js           # Main application entry point
├── config.js          # Configuration management (load/save/prompt)
├── config.json        # Credentials storage (gitignored)
├── package.json       # Node.js dependencies and scripts
└── README.md          # This file
```

## Troubleshooting

### "No CSV files found in the current directory"

The application looks for `.csv` files in the current working directory. Make sure:
- You have at least one `.csv` file in the directory where you run the command
- The file has the `.csv` extension (case-sensitive on some systems)

### How to change CSV file selection

If you want to process a different CSV file:
1. Delete `config.json`: `rm config.json`
2. Run the app again: `npm start`
3. You'll be prompted to reconfigure (Okta credentials + CSV selection)

### "Invalid Okta domain" error

If you see this error, ensure your Okta domain:
- Ends with `.okta.com` or `.oktapreview.com`
- Examples of valid domains:
  - ✓ `your-tenant.okta.com`
  - ✓ `https://your-tenant.okta.com` (will be normalized)
  - ✓ `dev-12345.oktapreview.com`
  - ✗ `example.com` (invalid - not an Okta domain)
  - ✗ `okta.io` (invalid - wrong TLD)

The app will keep prompting until you provide a valid Okta domain.

### "Configuration file not found" appears every time

The `config.json` file may not have write permissions. Check that the application directory is writable.

### "Error: 401 Unauthorized"

- Verify your API token is valid and not expired
- Check that the API token has appropriate permissions (needs app management permissions)
- Ensure your Okta domain is correct (without `https://`)

### "Failed to create app" errors

- Ensure your API token has permissions to create applications
- Check that the app name doesn't conflict with Okta's naming rules
- Verify your Okta tenant has available app slots (check license limits)

### "Cannot find module"

Run `npm install` to ensure all dependencies are installed.

## Custom Attributes

The application automatically creates custom app user attributes based on CSV column headers:

### Column Processing Rules

1. **Included Columns**: All CSV columns become custom attributes by default
2. **Excluded Columns**: Columns starting with `ent_` are automatically ignored
   - Example: `ent_CostCenter`, `ent_UserRole`, `ent_Permissions` will be skipped
3. **Duplicate Detection**: The app checks existing attributes and only creates new ones

### Example CSV Structure

```csv
Username,firstName,lastName,email,department,ent_CostCenter,ent_Permissions
john.doe,John,Doe,john@example.com,Engineering,CC100,Admin
```

From this CSV:
- ✓ Creates attributes: `Username`, `firstName`, `lastName`, `email`, `department`
- ✗ Skips: `ent_CostCenter`, `ent_Permissions`

### Viewing Custom Attributes

After the app runs, you can view the created custom attributes in Okta:
1. Go to **Applications** → Select your app
2. Navigate to **Provisioning** → **To App**
3. View the custom attributes in the attribute mappings

## SAML Configuration Notes

The application creates SAML 2.0 apps with default placeholder values:
- **SSO ACS URL**: `https://example.com/sso/saml`
- **Audience URI**: `https://example.com/{appName}`
- **Name ID Format**: Email address
- **Signature Algorithm**: RSA-SHA256

You'll need to update these values in the Okta Admin Console after creation to match your actual SAML service provider requirements.

## Security Notes

- The `config.json` file is automatically excluded from git via `.gitignore`
- Never commit API tokens to version control
- API tokens should be treated as passwords
- Rotate tokens regularly in production environments
- Consider using environment variables for production deployments

## License

ISC
