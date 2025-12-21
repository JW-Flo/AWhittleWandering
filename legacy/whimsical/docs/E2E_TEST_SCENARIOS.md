# E2E Test Scenarios - A Whittle Wandering

## Overview
Comprehensive end-to-end test scenarios for QA validation before production launch.

---

## 1. Flagship Journey Experience (Pre-Auth)

### 1.1 Landing Page Load
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/` | Hero section loads with "A Whittle Wandering" title |
| 2 | Verify styling | Pacific Northwest color palette (deep teals, mist greens) |
| 3 | Check animations | Fade-in animations complete smoothly |
| 4 | Scroll down | Stats section shows 15,847 miles, 48 states, 6,915 kWh |

### 1.2 Map Preview
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Preview Map" | Navigates to `/explore` |
| 2 | Map loads | Mapbox terrain map displays within 3 seconds |
| 3 | Waypoints visible | 65 waypoints render on the map |
| 4 | Click waypoint | Popup shows location details |

### 1.3 Feature Widget
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Request Feature" | Feature request form opens |
| 2 | Submit empty form | Validation errors display |
| 3 | Submit valid request | Success toast appears |

---

## 2. User Authentication Flow

### 2.1 Sign Up
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Sign In" on landing | SignInDialog modal opens |
| 2 | Click "Sign up" tab | Sign up form displays |
| 3 | Enter invalid email | Client-side validation error |
| 4 | Enter weak password | Password strength warning |
| 5 | Enter valid credentials | Account created, auto-redirected to `/dashboard` |
| 6 | Verify profile created | `profiles` table has new row with `user_id` |
| 7 | Verify role assigned | `user_roles` table has row with role='user' |

### 2.2 Sign In
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/` (logged out) | Landing page displays |
| 2 | Click "Sign In" | SignInDialog opens |
| 3 | Enter wrong password | "Invalid login credentials" error |
| 4 | Enter correct credentials | Redirected to `/dashboard` |
| 5 | Session persists | Refresh page, still authenticated |

### 2.3 Sign Out
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard | Dashboard loads |
| 2 | Click profile/sign out | Sign out executed |
| 3 | Session cleared | Redirected to `/` |
| 4 | Protected routes blocked | Attempting `/dashboard` redirects to auth |

### 2.4 Password Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Forgot Password" | Password reset form displays |
| 2 | Enter email | Reset email sent (check Supabase logs) |
| 3 | Click reset link | Password reset page loads |
| 4 | Enter new password | Password updated, can login |

---

## 3. Dashboard & Journey Management

### 3.1 Dashboard Load
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in and navigate to `/dashboard` | Dashboard renders |
| 2 | Check stats cards | Vehicle, journeys, analytics display |
| 3 | Check Journeys tab | Active/Archived tabs visible |
| 4 | Verify no errors | Console shows no errors |

### 3.2 Create Journey
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New Journey" | Journey creation wizard opens |
| 2 | Enter journey name | Name validated (non-empty) |
| 3 | Select vehicle make | Vehicle selector works |
| 4 | Complete wizard | Journey created in database |
| 5 | Journey appears in list | New journey visible in active tab |

### 3.3 Journey Quota Limit
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create 5 active journeys | All 5 appear in list |
| 2 | Attempt 6th journey | Error: "Maximum 5 active journeys" |
| 3 | Archive one journey | Journey moves to archived tab |
| 4 | Create new journey | Successfully created (slot freed) |

### 3.4 Archive/Restore Journey
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Archive" on journey | Confirmation dialog appears |
| 2 | Confirm archive | Journey moves to Archived tab |
| 3 | Journey has expiration | `archive_expires_at` set (1 year for active users) |
| 4 | Click "Restore" | Journey returns to Active tab |

### 3.5 Export Journey
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Export JSON" | JSON file downloads |
| 2 | Click "Export CSV" | CSV file downloads |
| 3 | Verify export content | Contains drives, charges, metadata |

### 3.6 Delete Journey
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Delete" | Confirmation dialog with warning |
| 2 | Confirm deletion | Journey removed from database |
| 3 | D1 database deleted | Cloudflare D1 database removed |
| 4 | Related data deleted | drive_data, charging_sessions, etc. removed |

---

## 4. Notification System

### 4.1 Email Notifications Setup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Settings → Notifications | NotificationSettings component loads |
| 2 | Toggle email notifications ON | `email_enabled` = true in DB |
| 3 | Select digest frequency | Saved to `email_digest_frequency` |

### 4.2 SMS Notifications Setup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle SMS notifications | SMS consent dialog appears |
| 2 | Read terms | Terms text displayed |
| 3 | Check consent boxes | Both checkboxes required |
| 4 | Enter phone number | E.164 format validation |
| 5 | Submit consent | `sms_consent_log` entry created |
| 6 | SMS enabled | `sms_enabled` = true |

### 4.3 Unsubscribe Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click unsubscribe in email | Navigates to `/settings?unsubscribe=true` |
| 2 | Verify unsubscription | `email_enabled` = false |
| 3 | Success message displays | "Unsubscribed Successfully" toast |

### 4.4 Email Digest Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Invoke `send-email-digest` function | Function executes |
| 2 | Check Resend logs | Email sent to recipient |
| 3 | Email contains | Journey updates, photos, unsubscribe link |

---

## 5. Admin Portal

### 5.1 Admin Access Control
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as non-admin user | Dashboard loads |
| 2 | Navigate to `/admin` | "Access Denied" toast, redirected |
| 3 | Login as admin user | Admin portal loads |
| 4 | Verify admin role | `user_roles` has role='admin' |

### 5.2 Pre-Launch Checklist
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Launch tab | PreLaunchChecklist component loads |
| 2 | All checks run | Status indicators show pass/fail |
| 3 | Click "Test Cleanup Cron" | archive-cleanup function invoked |
| 4 | Verify summary | Displays processed counts |

### 5.3 User Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search for user | Filter works by email/name |
| 2 | Change user role | Role updated in database |
| 3 | Lock account | `account_status` = 'locked' |
| 4 | Notification sent | Email/SMS sent to user |
| 5 | Unlock account | Status restored to 'active' |

### 5.4 Incident Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Incidents tab | Incident list displays |
| 2 | Create incident for user | Incident logged to `incident_log` |
| 3 | Select severity | Saved correctly |
| 4 | Enable notifications | Email + SMS sent via edge functions |

---

## 6. Security Tests

### 6.1 RLS Policy Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As User A, create journey | Journey has user_id = A |
| 2 | As User B, query User A's journey | Empty result (RLS blocks) |
| 3 | As User B, try UPDATE on A's journey | Error: RLS violation |
| 4 | As User B, try DELETE on A's journey | Error: RLS violation |

### 6.2 Admin Function Security
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call `incident-remediation` as non-admin | 403 Forbidden |
| 2 | Call `d1-stats` as non-admin | 403 Forbidden |
| 3 | Call with invalid JWT | 401 Unauthorized |

### 6.3 Public Endpoint Security
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call `get-mapbox-token` without auth | Token returned (expected) |
| 2 | Call `tessie-sync` without auth | Allowed (cron job) |
| 3 | Call `send-sms` without auth | 401 Unauthorized |

### 6.4 XSS Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create journal entry with `<script>` | Script tags escaped |
| 2 | Profile bio with HTML | HTML rendered as text |
| 3 | Search with injection | Input sanitized |

### 6.5 SQL Injection Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | API call with `'; DROP TABLE` | Request rejected or escaped |
| 2 | Form submit with SQL | Input sanitized |

---

## 7. Edge Function Tests

### 7.1 Archive Cleanup Cron
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set user `last_active_at` > 90 days ago | User marked inactive |
| 2 | Run archive-cleanup | Inactive notification queued |
| 3 | Set `archive_expires_at` in past | Journey marked for deletion |
| 4 | Run cleanup again | Journey and D1 deleted |

### 7.2 Tessie Sync
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Invoke tessie-sync | Drives fetched from Tessie API |
| 2 | Check `tessie_drives` table | New drives inserted |
| 3 | Run again | No duplicates (incremental sync) |

### 7.3 Weather API
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call weather function with lat/lon | Weather data returned |
| 2 | Call with invalid coordinates | Graceful error |

---

## 8. Mobile Responsiveness

### 8.1 Landing Page
| Screen Size | Breakpoint | Expected |
|-------------|-----------|----------|
| Desktop | 1920px | Full layout |
| Tablet | 768px | Stacked sections |
| Mobile | 375px | Single column |

### 8.2 Dashboard
| Screen Size | Expected |
|-------------|----------|
| Desktop | Sidebar + content |
| Tablet | Collapsible sidebar |
| Mobile | Full-width tabs |

### 8.3 Map
| Device | Expected |
|--------|----------|
| Desktop | Full controls visible |
| Mobile | Touch gestures work |

---

## 9. Performance Tests

### 9.1 Page Load Times
| Page | Target | Tool |
|------|--------|------|
| Landing | < 3s | Lighthouse |
| Dashboard | < 2s | Lighthouse |
| Map | < 4s | Network panel |

### 9.2 Database Query Performance
| Query | Target |
|-------|--------|
| Flagship waypoints | < 100ms |
| User journeys | < 200ms |
| Drive data (1000 rows) | < 500ms |

---

## 10. Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | ✅ Test |
| Firefox | 120+ | ✅ Test |
| Safari | 17+ | ✅ Test |
| Edge | 120+ | ✅ Test |
| Mobile Safari | iOS 17+ | ✅ Test |
| Chrome Android | 120+ | ✅ Test |

---

## Test Execution Checklist

- [ ] All 10 sections reviewed
- [ ] Critical paths (auth, journeys) passed
- [ ] Security tests passed
- [ ] Edge functions verified
- [ ] Mobile responsive confirmed
- [ ] Performance within targets
- [ ] No console errors
- [ ] No network errors
- [ ] Accessibility basics verified

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Security | | | |
