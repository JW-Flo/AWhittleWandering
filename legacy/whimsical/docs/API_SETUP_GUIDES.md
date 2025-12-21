# Vehicle API Setup Guides

## Tesla via Tessie

### What is Tessie?
Tessie is a third-party service that provides API access to your Tesla's data. It's the easiest way to connect your Tesla to AWW.

### Setup Steps

1. **Create Tessie Account**
   - Go to [tessie.com](https://tessie.com)
   - Sign up with your email
   - Cost: ~$5/month per vehicle

2. **Add Your Tesla**
   - In Tessie, click "Add Vehicle"
   - Log in with your Tesla account credentials
   - Authorize Tessie to access your vehicle
   - Your Tesla will appear in your Tessie dashboard

3. **Get Your API Key**
   - In Tessie, go to **Settings** (gear icon)
   - Navigate to **API**
   - Click **Generate API Key** (or copy existing)
   - Copy the key (starts with something like `tessie_...`)

4. **Connect to AWW**
   - In AWW, go to your vehicle settings
   - Click **Connect API**
   - Select **Tessie** as provider
   - Paste your API key
   - Click **Validate & Save**

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Regenerate key in Tessie |
| "Vehicle not found" | Ensure vehicle is added in Tessie first |
| "Rate limited" | Wait 1 minute, Tessie limits requests |

---

## Tesla via Tesla Fleet API

### What is Tesla Fleet API?
Tesla's official API for third-party developers. Requires more setup but is the official method.

### Prerequisites
- Tesla account with registered vehicle
- Ability to receive emails for verification

### Setup Steps

1. **Register as Developer** (One-time)
   - Go to [developer.tesla.com](https://developer.tesla.com)
   - Sign up with your Tesla account
   - Create an application
   - Note your Client ID and Client Secret

2. **Generate Virtual Key**
   - In Tesla Developer portal
   - Go to your application
   - Generate a virtual key pair
   - This allows the app to send commands

3. **OAuth Authorization**
   - In AWW, select Tesla Fleet API
   - Click "Connect with Tesla"
   - You'll be redirected to Tesla's login
   - Authorize AWW to access your vehicle
   - You'll be redirected back

4. **Key Card Tap** (for commands)
   - Some features require physical key card tap
   - You'll be prompted in the Tesla app if needed

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "OAuth failed" | Check redirect URI in Tesla dev portal |
| "Token expired" | Re-authorize in AWW settings |
| "Vehicle offline" | Wake vehicle first via Tesla app |

---

## Multi-Brand via Smartcar

### What is Smartcar?
Smartcar provides a unified API for multiple EV brands including Tesla, Ford, Rivian, and others.

### Supported Vehicles
- Tesla (all models)
- Ford (Mustang Mach-E, F-150 Lightning)
- Rivian (R1T, R1S)
- Chevrolet (Bolt, Blazer EV)
- BMW (iX, i4, i7)
- Mercedes (EQS, EQE)
- Volkswagen (ID.4)
- Hyundai/Kia EVs
- And more...

### Setup Steps

1. **Connect via OAuth**
   - In AWW, select your vehicle make
   - Choose **Smartcar** as provider
   - Click **Connect**

2. **Authorize Access**
   - You'll be redirected to Smartcar
   - Select your vehicle brand
   - Log in with your vehicle account
   - Grant permissions to AWW

3. **Select Permissions**
   - Location: Required for tracking
   - Odometer: Required for mileage
   - Battery: Required for EV stats
   - VIN: For vehicle identification

4. **Complete Connection**
   - After authorization, you'll return to AWW
   - Your vehicle will appear connected

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Brand not supported" | Check Smartcar's supported vehicles list |
| "Connection expired" | Re-authorize in AWW settings |
| "Missing permissions" | Reconnect and grant all permissions |

---

## Data We Collect

For all providers, AWW collects:

| Data Point | Purpose |
|------------|---------|
| Location (GPS) | Route mapping |
| Odometer | Distance calculation |
| Battery level | Efficiency tracking |
| Charging data | Session logging |
| Speed/heading | Route visualization |
| Temperature | Context for efficiency |

### What We Don't Access
- Vehicle controls (lock/unlock, climate)
- Personal information beyond driving data
- Payment information
- Contacts or media

---

## Security Notes

### Your API Credentials
- Encrypted at rest using industry-standard encryption
- Never logged or exposed in plaintext
- Accessible only by your authenticated session
- Can be deleted anytime from vehicle settings

### Data Isolation
- Each journey's telemetry is stored in a separate database
- No cross-user data queries possible
- You can export or delete your data anytime

### Revoking Access
To disconnect AWW from your vehicle:
1. In AWW: Delete API credentials in vehicle settings
2. In provider: Revoke AWW's access
   - Tessie: Remove from API keys
   - Tesla: Revoke in account settings
   - Smartcar: Revoke in Smartcar dashboard
