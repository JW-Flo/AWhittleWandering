# JWT_SECRET Information

## ✅ JWT_SECRET is Independent

**Important:** JWT_SECRET does NOT need to be created from TESLA_VIN or TESSIE_API_KEY.

- **JWT_SECRET** = Secure random string for admin authentication
- **TESLA_VIN** = Your vehicle's permanent identifier (cannot be changed)
- **TESSIE_API_KEY** = Your Tessie API authentication key

These are **three separate, independent credentials**.

---

## 🔐 Generated JWT_SECRET

A secure JWT_SECRET has been generated for you.

**Location:** `jwt-secret-generated.txt`

**To view:**
```bash
cat jwt-secret-generated.txt
```

**To add to GitHub Secrets:**
1. Copy the value from `jwt-secret-generated.txt`
2. Go to: `https://github.com/[OWNER]/[REPO]/settings/secrets/actions`
3. Click "New repository secret"
4. Name: `JWT_SECRET`
5. Value: Paste the generated value
6. Click "Add secret"

---

## 📋 About TESLA_VIN

**TESLA_VIN is fixed and cannot be changed** - this is correct!

- It's your vehicle's permanent 17-character identifier
- It's printed on your vehicle and registration
- Once set, it should remain the same
- Format: 17 characters (no I, O, or Q)

**To find your VIN:**
- Check your Tesla app
- Check your vehicle registration
- Check the driver's side dashboard (visible through windshield)
- Check your Tesla account online

**Example format:** `5YJ3E1EA5LF027324`

---

## 🔄 Next Steps

1. ✅ **JWT_SECRET** - Generated (add to GitHub Secrets)
2. ⏳ **TESLA_VIN** - You need to provide this (it's your vehicle's VIN)
3. ✅ **Sync all secrets** - Run sync workflow after adding both

---

## 📝 Quick Reference

| Credential | Status | Action |
|------------|--------|--------|
| TESSIE_API_KEY | ✅ In GitHub | Ready to sync |
| MAPBOX_ACCESS_TOKEN | ✅ In GitHub | Ready to sync |
| OPENWEATHER_API_KEY | ✅ In GitHub | Ready to sync |
| CLOUDFLARE_API_TOKEN | ✅ In GitHub | Ready to sync |
| **JWT_SECRET** | ✅ **Generated** | **Add to GitHub Secrets** |
| **TESLA_VIN** | ⏳ **Need your VIN** | **Add to GitHub Secrets** |

---

**JWT_SECRET is ready - just add it to GitHub Secrets along with your TESLA_VIN!**
