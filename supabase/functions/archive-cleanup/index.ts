import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inactive is 90 days, so total max storage for inactive is 180 days (90 days inactive + 90 days retention)
const INACTIVE_DAYS = 90;
const DAYS_BEFORE_DELETION_WARNING = 14;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Archive cleanup cron job started");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const CF_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const CF_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

    const now = new Date();
    const inactiveThreshold = new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
    const warningThreshold = new Date(now.getTime() + DAYS_BEFORE_DELETION_WARNING * 24 * 60 * 60 * 1000);

    // 1. Update archive expiration for newly inactive users
    console.log("Checking for newly inactive users...");
    const { data: inactiveProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, full_name, last_active_at")
      .lt("last_active_at", inactiveThreshold.toISOString());

    if (profileError) {
      console.error("Error fetching inactive profiles:", profileError);
    } else if (inactiveProfiles && inactiveProfiles.length > 0) {
      console.log(`Found ${inactiveProfiles.length} inactive users`);
      
      for (const profile of inactiveProfiles) {
        // Check if we need to send "you've become inactive" notification
        const daysSinceActive = profile.last_active_at 
          ? Math.floor((now.getTime() - new Date(profile.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
          : INACTIVE_DAYS;

        // Send inactive notification around the 90-day mark (89-92 days)
        if (daysSinceActive >= 89 && daysSinceActive <= 92) {
          console.log(`Sending inactive notification to user ${profile.user_id}`);
          
          // Queue email notification
          await supabase.from("notification_queue").insert({
            recipient_user_id: profile.user_id,
            notification_type: "account_inactive",
            title: "Your AWW Account is Inactive",
            body: "Your archived journeys will be deleted in 90 days unless you log in.",
            channels: ["email"],
            sent: false,
          });
        }

        // Update any archived journeys to have shorter expiration (90 days from archive date)
        const newExpiration = new Date();
        newExpiration.setDate(newExpiration.getDate() + 90);

        await supabase
          .from("journeys")
          .update({ archive_expires_at: newExpiration.toISOString() })
          .eq("user_id", profile.user_id)
          .not("archived_at", "is", null)
          .gt("archive_expires_at", newExpiration.toISOString());
      }
    }

    // 2. Send 2-week warning emails for journeys about to be deleted
    console.log("Checking for journeys needing deletion warning...");
    const { data: warningJourneys, error: warningError } = await supabase
      .from("journeys")
      .select(`
        id, name, user_id, archive_expires_at,
        profiles!inner(display_name, full_name)
      `)
      .not("archived_at", "is", null)
      .lte("archive_expires_at", warningThreshold.toISOString())
      .gt("archive_expires_at", now.toISOString());

    if (warningError) {
      console.error("Error fetching warning journeys:", warningError);
    } else if (warningJourneys && warningJourneys.length > 0) {
      console.log(`Found ${warningJourneys.length} journeys needing deletion warning`);

      for (const journey of warningJourneys) {
        const daysUntilDeletion = Math.ceil(
          (new Date(journey.archive_expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send warning once (check if already sent)
        const { data: existingNotification } = await supabase
          .from("notification_queue")
          .select("id")
          .eq("recipient_user_id", journey.user_id)
          .eq("notification_type", "deletion_warning")
          .eq("journey_id", journey.id)
          .single();

        if (!existingNotification) {
          console.log(`Queueing deletion warning for journey ${journey.id}`);
          
          await supabase.from("notification_queue").insert({
            recipient_user_id: journey.user_id,
            journey_id: journey.id,
            notification_type: "deletion_warning",
            title: `Journey "${journey.name}" will be deleted soon`,
            body: `Your archived journey will be permanently deleted in ${daysUntilDeletion} days. Export your data now to keep it.`,
            channels: ["email"],
            sent: false,
          });
        }
      }
    }

    // 3. Delete expired archived journeys
    console.log("Checking for expired archived journeys...");
    const { data: expiredJourneys, error: expiredError } = await supabase
      .from("journeys")
      .select("id, name, cloudflare_d1_id, user_id")
      .not("archived_at", "is", null)
      .lte("archive_expires_at", now.toISOString());

    if (expiredError) {
      console.error("Error fetching expired journeys:", expiredError);
    } else if (expiredJourneys && expiredJourneys.length > 0) {
      console.log(`Found ${expiredJourneys.length} expired journeys to delete`);

      for (const journey of expiredJourneys) {
        console.log(`Deleting expired journey: ${journey.id} (${journey.name})`);

        // Delete D1 database if exists
        if (journey.cloudflare_d1_id && CF_API_TOKEN && CF_ACCOUNT_ID) {
          try {
            const deleteResponse = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${journey.cloudflare_d1_id}`,
              {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${CF_API_TOKEN}` },
              }
            );
            const result = await deleteResponse.json();
            console.log(`D1 delete result for ${journey.id}:`, result.success);
          } catch (d1Error) {
            console.error(`Failed to delete D1 for journey ${journey.id}:`, d1Error);
          }
        }

        // Delete related data
        await supabase.from("drive_data").delete().eq("journey_id", journey.id);
        await supabase.from("charging_sessions").delete().eq("journey_id", journey.id);
        await supabase.from("journal_entries").delete().eq("journey_id", journey.id);
        await supabase.from("journey_media").delete().eq("journey_id", journey.id);
        await supabase.from("states_visited").delete().eq("journey_id", journey.id);
        await supabase.from("journey_followers").delete().eq("journey_id", journey.id);
        await supabase.from("notification_queue").delete().eq("journey_id", journey.id);

        // Delete the journey
        await supabase.from("journeys").delete().eq("id", journey.id);

        // Notify user
        await supabase.from("notification_queue").insert({
          recipient_user_id: journey.user_id,
          notification_type: "journey_deleted",
          title: `Journey "${journey.name}" has been deleted`,
          body: "Your archived journey has been permanently deleted due to inactivity. We hope to see you back soon!",
          channels: ["email"],
          sent: false,
        });
      }
    }

    // 4. Process pending notification emails
    console.log("Processing pending notification emails...");
    const { data: pendingNotifications, error: notifError } = await supabase
      .from("notification_queue")
      .select(`
        id, recipient_user_id, notification_type, title, body, journey_id,
        profiles!inner(display_name, full_name)
      `)
      .eq("sent", false)
      .in("notification_type", ["account_inactive", "deletion_warning", "journey_deleted"])
      .limit(50);

    if (notifError) {
      console.error("Error fetching pending notifications:", notifError);
    } else if (pendingNotifications && pendingNotifications.length > 0) {
      console.log(`Processing ${pendingNotifications.length} pending notifications`);
      
      // Send emails via send-archive-reminder function
      for (const notification of pendingNotifications) {
        try {
          const { error: sendError } = await supabase.functions.invoke("send-archive-reminder", {
            body: {
              recipientUserId: notification.recipient_user_id,
              userName: (notification as any).profiles?.display_name || (notification as any).profiles?.full_name || "Explorer",
              notificationType: notification.notification_type,
              title: notification.title,
              body: notification.body,
              journeyId: notification.journey_id,
            },
          });

          if (!sendError) {
            await supabase
              .from("notification_queue")
              .update({ sent: true, sent_at: new Date().toISOString() })
              .eq("id", notification.id);
          }
        } catch (emailError) {
          console.error(`Failed to send notification ${notification.id}:`, emailError);
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      inactiveUsersProcessed: inactiveProfiles?.length || 0,
      warningsQueued: warningJourneys?.length || 0,
      journeysDeleted: expiredJourneys?.length || 0,
      notificationsProcessed: pendingNotifications?.length || 0,
    };

    console.log("Archive cleanup completed:", summary);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Archive cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
