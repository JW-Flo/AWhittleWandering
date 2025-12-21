import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  recipientUserId: string;
  notificationType: "waypoint" | "state_crossing" | "photo" | "charging";
  journeyName: string;
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Only allow calls from admin users or internal services
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Check if this is an internal service call (using service role key)
    const isServiceCall = authHeader === `Bearer ${serviceRoleKey}`;
    
    if (!isServiceCall) {
      // If not a service call, must be an authenticated admin user
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized - No authorization header" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the user has admin role
      const { data: isAdmin, error: roleError } = await supabaseAuth.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });

      if (roleError || !isAdmin) {
        console.error("Role check failed:", roleError);
        return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("SMS send authorized for admin user:", user.id);
    } else {
      console.log("SMS send authorized via service role key");
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    if (!accountSid || !authToken || !messagingServiceSid) {
      throw new Error("Twilio credentials not configured. Need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { recipientUserId, notificationType, journeyName, message }: SMSRequest = await req.json();

    // Get user's notification preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("sms_enabled, phone_number, notify_new_waypoint, notify_state_crossing, notify_photos, notify_charging_stop")
      .eq("user_id", recipientUserId)
      .single();

    if (prefsError || !prefs) {
      console.log("No notification preferences found for user:", recipientUserId);
      return new Response(JSON.stringify({ skipped: true, reason: "No preferences" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if SMS is enabled and notification type is allowed
    if (!prefs.sms_enabled || !prefs.phone_number) {
      return new Response(JSON.stringify({ skipped: true, reason: "SMS not enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeEnabled = {
      waypoint: prefs.notify_new_waypoint,
      state_crossing: prefs.notify_state_crossing,
      photo: prefs.notify_photos,
      charging: prefs.notify_charging_stop,
    };

    if (!typeEnabled[notificationType]) {
      return new Response(JSON.stringify({ skipped: true, reason: "Notification type disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", prefs.phone_number);
    formData.append("MessagingServiceSid", messagingServiceSid);
    formData.append("Body", `🗺️ AWW Update - ${journeyName}: ${message}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      throw new Error(twilioResult.message || "Failed to send SMS");
    }

    console.log("SMS sent successfully:", twilioResult.sid);

    // Log to notification queue
    await supabase.from("notification_queue").insert({
      recipient_user_id: recipientUserId,
      notification_type: notificationType,
      title: `Journey Update: ${journeyName}`,
      body: message,
      channels: ["sms"],
      sent: true,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, messageSid: twilioResult.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
