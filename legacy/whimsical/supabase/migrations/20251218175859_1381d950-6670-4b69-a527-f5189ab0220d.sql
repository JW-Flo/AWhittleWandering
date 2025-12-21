-- =====================================================
-- FINAL SECURITY HARDENING - REVOKE ALL ANON ACCESS
-- =====================================================

-- 1. PROFILES - No anon access
REVOKE SELECT ON public.profiles FROM anon;

-- 2. NOTIFICATION_PREFERENCES - No anon access
REVOKE ALL ON public.notification_preferences FROM anon;

-- 3. LOGIN_ALERTS - No anon access
REVOKE ALL ON public.login_alerts FROM anon;

-- 4. TRUSTED_DEVICES - No anon access  
REVOKE ALL ON public.trusted_devices FROM anon;

-- 5. SPOTIFY_CONNECTIONS - No anon access
REVOKE ALL ON public.spotify_connections FROM anon;

-- 6. USER_API_CREDENTIALS - No anon access
REVOKE ALL ON public.user_api_credentials FROM anon;

-- 7. VEHICLES - No anon access
REVOKE ALL ON public.vehicles FROM anon;

-- 8. SMS_CONSENT_LOG - No anon access
REVOKE ALL ON public.sms_consent_log FROM anon;

-- 9. INCIDENT_LOG - No anon access
REVOKE ALL ON public.incident_log FROM anon;

-- 10. SECURITY_AUDIT_LOG - No anon access
REVOKE ALL ON public.security_audit_log FROM anon;

-- 11. NOTIFICATION_QUEUE - No anon access
REVOKE ALL ON public.notification_queue FROM anon;

-- 12. USER_FOLLOWS - No anon access
REVOKE ALL ON public.user_follows FROM anon;

-- 13. USER_ROLES - No anon access (critical security table)
REVOKE ALL ON public.user_roles FROM anon;

-- 14. JOURNEY_NOTIFICATION_SETTINGS - No anon access
REVOKE ALL ON public.journey_notification_settings FROM anon;

-- 15. TESSIE_DRIVES - No anon access
REVOKE ALL ON public.tessie_drives FROM anon;

-- 16. FLAGSHIP_WAYPOINTS - Already secured with has_role, revoke anon
REVOKE SELECT ON public.flagship_waypoints FROM anon;

-- 17. Additional tables that might have anon access
REVOKE ALL ON public.journeys FROM anon;
REVOKE ALL ON public.drive_data FROM anon;
REVOKE ALL ON public.charging_sessions FROM anon;
REVOKE ALL ON public.journal_entries FROM anon;
REVOKE ALL ON public.journey_followers FROM anon;
REVOKE ALL ON public.journey_media FROM anon;
REVOKE ALL ON public.journey_tracks FROM anon;
REVOKE ALL ON public.states_visited FROM anon;

-- Keep api_providers readable for authenticated users (needed for onboarding)
-- Keep vehicle_makes readable (needed for vehicle selection UI)

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tessie_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagship_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states_visited ENABLE ROW LEVEL SECURITY;