# A Whittle Wandering - User Guide

## Account Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| **Active Journeys** | 5 per user | Each journey gets dedicated cloud storage |
| **Media Storage** | Unlimited | Photos stored in secure cloud bucket |

> **Note**: To create a new journey after reaching the limit, archive or delete an existing one.

---

## Getting Started

### Creating Your Account

1. Visit [awhittlewandering.com](https://www.awhittlewandering.com)
2. Click **Sign In** → **Create Account**
3. Enter your email and create a password
4. Verify your email (check spam folder if needed)

---

## Starting Your First Journey

### Step 1: Add Your Vehicle

Before creating a journey, you need to add your vehicle:

1. Go to **Dashboard** → **Vehicles** → **Add Vehicle**
2. Enter your vehicle details:
   - **Nickname**: A friendly name (e.g., "Shadowfax")
   - **Make**: Select your manufacturer (Tesla, Rivian, etc.)
   - **Model**: Your specific model
   - **Year**: Model year

### Step 2: Connect Your Vehicle API

To track your drives automatically, connect a vehicle data provider:

#### For Tesla Owners (Tessie)

1. Create a Tessie account at [tessie.com](https://tessie.com)
2. Add your Tesla to Tessie
3. Go to **Settings** → **API** in Tessie
4. Copy your API key
5. In AWW, go to **Dashboard** → **Vehicles** → Select your vehicle
6. Click **Connect API** → Select **Tessie**
7. Paste your API key

#### For Other EVs (Smartcar)

1. In AWW vehicle settings, select **Smartcar**
2. Click **Connect** and follow OAuth flow
3. Authorize AWW to access your vehicle data

### Step 3: Create a Journey

1. Go to **Dashboard** → **New Journey**
2. Fill in journey details:
   - **Name**: Give your adventure a name
   - **Description**: Optional details
   - **Start Date**: When you're beginning
   - **Vehicle**: Select your connected vehicle
3. Click **Create Journey**

### Step 4: Automatic Data Sync

Once created, your journey will:
- Automatically sync drive data every hour
- Record charging sessions
- Track states visited
- Calculate efficiency metrics

---

## Understanding Your Dashboard

### Journey Stats

| Metric | Description |
|--------|-------------|
| **Total Miles** | Distance covered |
| **Total kWh** | Energy consumed |
| **Efficiency** | Wh/mi average |
| **States Visited** | Unique states |
| **Charging Sessions** | Number of charges |

### The Map

Your journey route appears on an interactive map with:
- 🟢 **Green markers**: Starting points
- 🟠 **Orange markers**: Highlights
- 🟣 **Purple markers**: Friend visits
- 🟢 **Dark green markers**: Parks
- 🔴 **Red markers**: Ending points

#### Map Controls
- **Play**: Animate through your journey
- **Skip**: Jump to next waypoint
- **Reset**: Return to overview

---

## Managing Your Journeys

### Exporting Data

Before archiving or deleting a journey, export your data:

1. Go to your journey in the dashboard
2. Click **Export Data**
3. Download the JSON file with all drives and charging sessions
4. Keep this file for your permanent records

### Archiving Journeys

Archive journeys to free up slots while keeping data in cold storage:

1. Click **Archive** on the journey card
2. Review the retention policy
3. Confirm archiving

**Retention Policy:**
| Account Status | Data Retention |
|----------------|----------------|
| Active (monthly login) | 1 year |
| Inactive | 90 days |

Archived journeys can be restored anytime before expiration.

### Deleting Journeys

⚠️ **Warning**: Deletion is permanent and cannot be undone.

1. Click **Delete** on the journey card
2. Confirm you want to permanently delete
3. All data including cloud storage is removed

---

## Adding Waypoints

Waypoints are special stops on your journey. To add one:

1. Go to your journey dashboard
2. Click **Add Waypoint**
3. Enter details:
   - **Name**: Location name
   - **Type**: Stop, Park, Friend, Landmark
   - **Description**: What happened here
   - **People Met**: Tag friends/family

---

## Uploading Photos

Capture memories with journey photos:

1. Go to **Journey** → **Photos**
2. Click **Upload**
3. Select photos from your device
4. Add optional captions and tags
5. Photos are automatically organized by date

### Photo Privacy

Control who sees your photos:
- **Public**: Anyone can view
- **Followers**: Only approved followers
- **Private**: Only you

---

## Following Other Journeys

### Finding Journeys

1. Go to **Explore** tab
2. Browse public journeys
3. Click on one to view details

### Following

1. On a journey page, click **Follow**
2. If the journey requires approval, wait for owner to accept
3. Once approved, you'll receive updates

### Notifications

Choose how to be notified:
- **Email**: Daily or weekly digests
- **SMS**: Real-time updates (requires consent)
- **Push**: Browser notifications

---

## Privacy & Security

### Your Data

- **Drive data**: Stored in isolated database per journey
- **Photos**: Stored securely with your privacy settings
- **API keys**: Encrypted, never exposed

### Privacy Controls

In **Settings** → **Privacy**:
- Set default photo visibility
- Control location precision (exact, city, region, state)
- Anonymize username if desired

### Two-Factor Authentication

Enable 2FA for extra security:
1. Go to **Settings** → **Security**
2. Click **Enable 2FA**
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes safely

---

## Troubleshooting

### My drives aren't syncing

1. Check your API connection in **Vehicle Settings**
2. Verify your API key is still valid
3. Wait up to 1 hour for next sync
4. Check if your vehicle has been driven recently

### I can't see my photos

1. Check your visibility settings
2. Ensure photos uploaded successfully
3. Try refreshing the page

### Map isn't loading

1. Check your internet connection
2. Try a different browser
3. Clear browser cache

---

## Getting Help

- **Documentation**: [docs.awhittlewandering.com](https://docs.awhittlewandering.com)
- **Feature Requests**: Use the "Request Feature" button
- **Support**: Contact via settings page

---

## Terms & Policies

- [Privacy Policy](/privacy)
- [Terms of Service](/terms)
- [SMS Terms](/sms-terms)
