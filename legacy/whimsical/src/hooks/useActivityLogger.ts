import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';

type ActivityAction = 
  // Navigation
  | 'page_view'
  | 'navigate'
  // Authentication
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  // Journey interactions
  | 'journey_view'
  | 'journey_create'
  | 'journey_update'
  | 'journey_delete'
  | 'journey_share'
  | 'journey_follow'
  | 'journey_unfollow'
  // Waypoint interactions
  | 'waypoint_view'
  | 'waypoint_click'
  | 'route_playback_start'
  | 'route_playback_pause'
  | 'route_playback_complete'
  // Media interactions
  | 'media_view'
  | 'media_upload'
  | 'media_delete'
  | 'media_download'
  | 'gallery_open'
  // Settings interactions
  | 'settings_view'
  | 'settings_update'
  | 'notification_toggle'
  | 'privacy_update'
  | 'vehicle_add'
  | 'vehicle_edit'
  | 'vehicle_delete'
  | 'api_key_add'
  | 'api_key_remove'
  // Social interactions
  | 'social_share'
  | 'social_connect'
  | 'social_disconnect'
  | 'follow_user'
  | 'unfollow_user'
  // UI interactions
  | 'button_click'
  | 'tab_change'
  | 'modal_open'
  | 'modal_close'
  | 'drawer_open'
  | 'drawer_close'
  | 'search'
  | 'filter_apply'
  | 'sort_change'
  // Feature requests
  | 'feature_request_submit'
  // Map interactions
  | 'map_zoom'
  | 'map_pan'
  | 'map_marker_click'
  // Errors
  | 'error_occurred'
  | 'map_load_failed';

interface ActivityMetadata {
  page_path?: string;
  journey_id?: string;
  waypoint_id?: string;
  media_id?: string;
  vehicle_id?: string;
  button_name?: string;
  tab_name?: string;
  modal_name?: string;
  search_query?: string;
  filter_type?: string;
  error_message?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = useCallback(async (
    action: ActivityAction,
    resourceType: string,
    resourceId?: string,
    metadata?: ActivityMetadata
  ) => {
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            is_authenticated: !!user,
            user_agent: navigator.userAgent,
            page_url: window.location.href
          }
        });

      if (error) {
        console.warn('Failed to log activity:', error.message);
      }
    } catch (error) {
      // Silently fail - don't break user experience for logging
      console.warn('Activity logging error:', error);
    }
  }, [user]);

  // Convenience methods for common actions
  const logPageView = useCallback((pagePath: string) => 
    logActivity('page_view', 'page', undefined, { page_path: pagePath }), [logActivity]);

  const logJourneyView = useCallback((journeyId: string) => 
    logActivity('journey_view', 'journey', journeyId), [logActivity]);

  const logButtonClick = useCallback((buttonName: string, context?: string) => 
    logActivity('button_click', 'ui', undefined, { button_name: buttonName, context }), [logActivity]);

  const logTabChange = useCallback((tabName: string) => 
    logActivity('tab_change', 'ui', undefined, { tab_name: tabName }), [logActivity]);

  const logModalOpen = useCallback((modalName: string) => 
    logActivity('modal_open', 'ui', undefined, { modal_name: modalName }), [logActivity]);

  const logModalClose = useCallback((modalName: string) => 
    logActivity('modal_close', 'ui', undefined, { modal_name: modalName }), [logActivity]);

  const logSearch = useCallback((query: string) => 
    logActivity('search', 'search', undefined, { search_query: query }), [logActivity]);

  const logError = useCallback((errorMessage: string, context?: string) => 
    logActivity('error_occurred', 'error', undefined, { error_message: errorMessage, context }), [logActivity]);

  const logMediaUpload = useCallback((mediaId: string, journeyId?: string) => 
    logActivity('media_upload', 'media', mediaId, { journey_id: journeyId }), [logActivity]);

  const logRoutePlayback = useCallback((action: 'start' | 'pause' | 'complete', journeyId: string) => 
    logActivity(`route_playback_${action}` as ActivityAction, 'playback', journeyId), [logActivity]);

  const logSettingsUpdate = useCallback((settingType: string) => 
    logActivity('settings_update', 'settings', undefined, { setting_type: settingType }), [logActivity]);

  const logSocialShare = useCallback((platform: string, journeyId?: string) => 
    logActivity('social_share', 'social', journeyId, { platform }), [logActivity]);

  return {
    logActivity,
    logPageView,
    logJourneyView,
    logButtonClick,
    logTabChange,
    logModalOpen,
    logModalClose,
    logSearch,
    logError,
    logMediaUpload,
    logRoutePlayback,
    logSettingsUpdate,
    logSocialShare
  };
}
