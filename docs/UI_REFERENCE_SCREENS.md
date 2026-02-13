# UI Reference Screens

Reference screenshots from a previous Lovable.dev build that captured the desired look and feel for AWW. These serve as the design target for ongoing frontend development.

---

## Screen 1: AI Chat Interface

**Status:** Not yet implemented (documented for future reference)

- Dark themed with "V" logo branding element at top
- Chat prompt placeholder: "Ask about routes, charging, or trip planning!"
- Quick-action pill buttons at bottom of chat area:
  - "Share my location"
  - "Plan a route from..."
  - "Where should I charge?"
- Minimal, conversational layout focused on trip planning assistance
- Clean message bubbles with AI/user distinction

---

## Screen 2: Settings / Vehicles Page

**Status:** Example implementation at `/settings`

- Header with "Settings" title and back-to-dashboard navigation
- Tabbed sidebar navigation (vertical on desktop, horizontal scroll on mobile):
  - Account, **Vehicles** (default), Security, Privacy, Notifications, Integrations
- **Vehicles tab content:**
  - "Your Vehicles" heading
  - Vehicle card showing:
    - Name: "Midnight Shadow"
    - Model: 2025 Tesla Model Y
    - VIN (partially masked)
    - Connection badge: "Connected via Tessie"
    - API Connection Test button with status indicator (success/error)
  - "Add Another Vehicle" outline button
  - Slot counter: "1 of 5 vehicle slots used"

---

## Screen 3: Explore Journey Page

**Status:** Example implementation at `/explore`

This is the most visually impressive screen and the hero experience for public followers.

- Header: "Explore AWW Journey"
- Subtitle: "48-state Tesla road trip - June - August 2025"
- Badge row: "Features Unlocked" (primary accent), view count, visitor count
- **Large satellite Mapbox map** fills ~60-70% of viewport
  - Uses `mapbox://styles/mapbox/satellite-streets-v12`
  - Shows journey waypoints that update as timeline scrubs
  - Gradient overlay at bottom for timeline blending
- **Timeline Playback Bar** (overlaid at bottom with frosted glass effect):
  - Date range labels (start and end)
  - Slider scrubber spanning full trip duration
  - Current date display below slider
  - Playback controls: Skip to start, Previous, **Play/Pause**, Next, Skip to end
  - Speed controls: 0.5x, 1x, 2x toggle

---

## Screen 4: Analytics / Campaigns

**Status:** Partially covered by existing `AdvancedAnalyticsDashboard`

- Top-level tab navigation:
  - Sessions, Pages, Sources, Devices, Geography, **Campaigns**
- UTM Campaigns section with empty state: "No UTM campaign data yet"
- Web analytics focus (session tracking, page views, traffic sources)
- Geographic breakdown of visitors

---

## Cross-Cutting Design Notes

- **Theme:** Warm, dark journal-like palette (not dashboard-like)
- **Background:** HSL 30 12% 8% (very dark brown)
- **Primary accent:** HSL 174 45% 44% (Tesla-inspired teal/cyan)
- **Cards:** HSL 30 14% 11% with subtle borders
- **Typography:** Clean, minimal, narrative-focused
- **Frosted glass:** `bg-card/80 backdrop-blur-md` for overlaid controls
- **Badges:** Outline style by default, primary accent for feature/status badges
- **Design tokens:** All defined in `frontend/src/index.css`
