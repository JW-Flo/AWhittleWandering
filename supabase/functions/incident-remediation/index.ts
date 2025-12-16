import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncidentRequest {
  action: "lock" | "unlock" | "suspend" | "review";
  userId: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  sendNotifications: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !adminUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: adminUser.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, reason, severity, sendNotifications }: IncidentRequest = await req.json();

    console.log(`Processing incident action: ${action} for user: ${userId}`);

    // Get user profile and notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, user_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: notifPrefs } = await supabase
      .from("notification_preferences")
      .select("sms_enabled, phone_number, email_enabled")
      .eq("user_id", userId)
      .single();

    // Determine new account status
    const statusMap = {
      lock: "locked",
      unlock: "active",
      suspend: "suspended",
      review: "pending_review",
    };
    const newStatus = statusMap[action];

    // Update account status
    const updateData: Record<string, unknown> = {
      account_status: newStatus,
    };

    if (action === "lock" || action === "suspend") {
      updateData.locked_at = new Date().toISOString();
      updateData.locked_reason = reason;
      updateData.locked_by = adminUser.id;
    } else if (action === "unlock") {
      updateData.locked_at = null;
      updateData.locked_reason = null;
      updateData.locked_by = null;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    // Track notification channels used
    const notificationChannels: string[] = [];
    let notificationsSent = false;

    // Send notifications if requested
    if (sendNotifications && (action === "lock" || action === "suspend")) {
      const emailSubject = action === "lock" 
        ? "Account Security Alert - Your AWW Account Has Been Locked"
        : "Account Notice - Your AWW Account Has Been Suspended";

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">🔒 Account ${action === "lock" ? "Locked" : "Suspended"}</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hello ${profile.full_name || "there"},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your A Whittle Wandering account has been ${action === "lock" ? "temporarily locked" : "suspended"} due to the following reason:
          </p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: 500;">${reason}</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you believe this was done in error, or if you need assistance regaining access to your account, please contact our support team immediately.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              <strong>What to do next:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px;">
              <li>Review your recent account activity</li>
              <li>Change your password if you suspect unauthorized access</li>
              <li>Contact <a href="mailto:support@awhittlewandering.com" style="color: #2563eb;">support@awhittlewandering.com</a> to appeal</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
            This is an automated security notification from A Whittle Wandering.
          </p>
        </div>
      `;

      // Send email if Resend is configured
      if (resendApiKey && profile.email) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: "AWW Security <security@awhittlewandering.com>",
            to: [profile.email],
            subject: emailSubject,
            html: emailHtml,
          });
          notificationChannels.push("email");
          notificationsSent = true;
          console.log(`Email sent to ${profile.email}`);
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }

      // Send SMS if Twilio is configured and user has SMS enabled
      if (twilioSid && twilioAuth && notifPrefs?.sms_enabled && notifPrefs?.phone_number) {
        try {
          const smsMessage = `⚠️ AWW Alert: Your account has been ${action === "lock" ? "locked" : "suspended"}. Reason: ${reason.slice(0, 100)}${reason.length > 100 ? "..." : ""}. Contact support@awhittlewandering.com for assistance.`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const auth = btoa(`${twilioSid}:${twilioAuth}`);

          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: notifPrefs.phone_number,
              From: Deno.env.get("TWILIO_PHONE_NUMBER") || "+15005550006",
              Body: smsMessage,
            }),
          });
          notificationChannels.push("sms");
          notificationsSent = true;
          console.log(`SMS sent to ${notifPrefs.phone_number}`);
        } catch (smsErr) {
          console.error("SMS send error:", smsErr);
        }
      }
    }

    // Log the incident
    const { data: incident, error: incidentError } = await supabase
      .from("incident_log")
      .insert({
        user_id: userId,
        incident_type: `account_${action}`,
        severity,
        description: reason,
        action_taken: `Account ${action}ed by admin`,
        notification_sent: notificationsSent,
        notification_channels: notificationChannels,
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (incidentError) {
      console.error("Error logging incident:", incidentError);
    }

    // Also log to security audit
    await supabase.from("security_audit_log").insert({
      user_id: adminUser.id,
      action: `admin_account_${action}`,
      resource_type: "user",
      resource_id: userId,
      metadata: {
        reason,
        severity,
        notifications_sent: notificationChannels,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        newStatus,
        notificationsSent,
        notificationChannels,
        incidentId: incident?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Incident remediation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
