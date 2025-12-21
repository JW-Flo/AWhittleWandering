import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find active journeys (started but not completed, with recent activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeJourneys, error: journeyError } = await supabase
      .from('journeys')
      .select(`
        id,
        name,
        user_id,
        start_date,
        updated_at
      `)
      .eq('is_complete', false)
      .is('archived_at', null)
      .gte('updated_at', thirtyDaysAgo.toISOString());

    if (journeyError) {
      console.error('Error fetching journeys:', journeyError);
      throw journeyError;
    }

    if (!activeJourneys || activeJourneys.length === 0) {
      console.log('No active journeys found');
      return new Response(
        JSON.stringify({ message: 'No active journeys to remind' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${activeJourneys.length} active journeys`);

    const remindersQueued: string[] = [];

    for (const journey of activeJourneys) {
      // Check user's notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('notify_daily_memory, email_enabled, push_enabled')
        .eq('user_id', journey.user_id)
        .single();

      if (!prefs?.notify_daily_memory) {
        console.log(`User ${journey.user_id} has memory reminders disabled`);
        continue;
      }

      // Check if we already sent a reminder today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingReminder } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('recipient_user_id', journey.user_id)
        .eq('notification_type', 'memory_reminder')
        .eq('journey_id', journey.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .single();

      if (existingReminder) {
        console.log(`Already sent reminder for journey ${journey.id} today`);
        continue;
      }

      // Get the most recent waypoint for context
      const { data: recentWaypoint } = await supabase
        .from('flagship_waypoints')
        .select('name, location, state_code')
        .order('arrived_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate journey stats for the message
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const locationContext = recentWaypoint 
        ? `near ${recentWaypoint.name}` 
        : 'on your journey';

      const reminderMessages = [
        `Day ${daysSinceStart} ${locationContext}! What surprised you today?`,
        `Time to capture today's memories from ${journey.name}. What stood out?`,
        `Don't let today's moments fade! Record a quick voice note ${locationContext}.`,
        `Day ${daysSinceStart} update: What will you remember about today?`,
        `Quick memory check! Anything worth noting from your adventures today?`
      ];

      const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];

      // Queue the notification
      const channels: string[] = [];
      if (prefs.email_enabled) channels.push('email');
      if (prefs.push_enabled) channels.push('push');

      const { error: queueError } = await supabase
        .from('notification_queue')
        .insert({
          recipient_user_id: journey.user_id,
          journey_id: journey.id,
          notification_type: 'memory_reminder',
          title: '📝 Capture Today\'s Memories',
          body: message,
          channels: channels,
          sent: false
        });

      if (queueError) {
        console.error(`Error queuing reminder for ${journey.id}:`, queueError);
      } else {
        remindersQueued.push(journey.id);
        console.log(`Queued memory reminder for journey ${journey.name}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersQueued: remindersQueued.length,
        journeyIds: remindersQueued 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Memory reminder error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
