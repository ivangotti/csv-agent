# Okta Domain Validation Tests

This document demonstrates the domain validation functionality added to the CSV Agent application.

## Validation Rules

The application validates Okta domains to ensure they are legitimate Okta URLs:

1. **Accepts** domains with or without `https://` protocol
2. **Strips** protocol and trailing slashes before saving
3. **Requires** domain to end with `.okta.com` or `.oktapreview.com`
4. **Loops** until valid input is provided

## Test Cases

### ✓ Valid Inputs (Accepted)

| Input | Normalized Output | Status |
|-------|------------------|--------|
| `your-tenant.okta.com` | `your-tenant.okta.com` | ✓ Valid |
| `https://your-tenant.okta.com` | `your-tenant.okta.com` | ✓ Valid |
| `https://your-tenant.okta.com/` | `your-tenant.okta.com` | ✓ Valid |
| `http://your-tenant.okta.com` | `your-tenant.okta.com` | ✓ Valid |
| `dev-12345.oktapreview.com` | `dev-12345.oktapreview.com` | ✓ Valid |
| `https://dev-12345.oktapreview.com/` | `dev-12345.oktapreview.com` | ✓ Valid |
| `subdomain.test.okta.com` | `subdomain.test.okta.com` | ✓ Valid |

### ✗ Invalid Inputs (Rejected)

| Input | Error Message |
|-------|--------------|
| `example.com` | Invalid Okta domain. Must end with .okta.com or .oktapreview.com |
| `okta.io` | Invalid Okta domain. Must end with .okta.com or .oktapreview.com |
| `google.com` | Invalid Okta domain. Must end with .okta.com or .oktapreview.com |
| `https://auth0.com` | Invalid Okta domain. Must end with .okta.com or .oktapreview.com |
| `my-tenant.okta.net` | Invalid Okta domain. Must end with .okta.com or .oktapreview.com |

## Validation Behavior

### First-Time Setup

When running for the first time (no config.json):

```
Configuration file not found. Please provide the following information:

Okta Tenant URL (e.g., your-tenant.okta.com or https://your-tenant.okta.com): example.com
✗ Invalid Okta domain. Must end with .okta.com or .oktapreview.com
  Please enter a valid Okta domain (e.g., your-tenant.okta.com)

Okta Tenant URL (e.g., your-tenant.okta.com or https://your-tenant.okta.com): https://your-tenant.okta.com/
✓ Valid Okta domain: your-tenant.okta.com
Okta API Token: ****
```

### Existing Config Validation

If config.json exists with an invalid domain:

```
⚠️  Warning: Existing configuration has an invalid Okta domain: example.com
   Invalid Okta domain. Must end with .okta.com or .oktapreview.com

Please reconfigure:

Okta Tenant URL (e.g., your-tenant.okta.com or https://your-tenant.okta.com):
```

## Implementation Details

### Validation Function

Located in `config.js`:

```javascript
function validateOktaDomain(input) {
  // Clean up: remove protocol and trailing slashes
  let domain = input.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  // Check if it's a valid Okta domain
  const isValidOkta = domain.endsWith('.okta.com') ||
                      domain.endsWith('.oktapreview.com') ||
                      domain === 'okta.com' ||
                      domain === 'oktapreview.com';

  if (!isValidOkta) {
    return {
      valid: false,
      domain: null,
      error: 'Invalid Okta domain. Must end with .okta.com or .oktapreview.com'
    };
  }

  return {
    valid: true,
    domain: domain,
    error: null
  };
}
```

### When Validation Runs

1. **During interactive setup** - Loops until valid input provided
2. **When loading existing config** - Validates and prompts for reconfiguration if invalid

## Benefits

- **User-friendly**: Accepts multiple input formats
- **Security**: Prevents typos that could leak credentials to wrong domains
- **Reliability**: Ensures API calls go to legitimate Okta endpoints
- **Error prevention**: Catches common mistakes like including protocol or trailing slashes
