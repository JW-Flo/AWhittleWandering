import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestRequest {
  recipientUserId: string;
  journeyId: string;
  journeyName: string;
  highlights: Array<{
    type: "waypoint" | "state_crossing" | "photo" | "charging";
    title: string;
    description: string;
    imageUrl?: string;
    date: string;
  }>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { recipientUserId, journeyId, journeyName, highlights }: DigestRequest = await req.json();

    // Get user's email and preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, display_name, full_name")
      .eq("user_id", recipientUserId)
      .single();

    if (profileError || !profile?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: "No email found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", recipientUserId)
      .single();

    if (!prefs?.email_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "Email not enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userName = profile.display_name || profile.full_name || "Explorer";

    // Build HTML email
    const highlightsHtml = highlights.map(h => `
      <tr>
        <td style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; gap: 16px;">
            ${h.imageUrl ? `<img src="${h.imageUrl}" alt="${h.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px;" />` : ''}
            <div>
              <p style="margin: 0 0 4px; color: #d97706; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${h.type.replace('_', ' ')}</p>
              <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px;">${h.title}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${h.description}</p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">${h.date}</p>
            </div>
          </div>
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #ea580c 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🗺️ AWW Journey Update</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${journeyName}</p>
              </td>
            </tr>
            
            <!-- Greeting -->
            <tr>
              <td style="padding: 30px 20px 20px;">
                <p style="margin: 0; color: #374151; font-size: 16px;">Hey ${userName}! 👋</p>
                <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Here's what's been happening on the journey you're following. Check out these latest highlights!
                </p>
              </td>
            </tr>
            
            <!-- Highlights -->
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 12px; margin: 0 20px; width: calc(100% - 40px);">
                  ${highlightsHtml}
                </table>
              </td>
            </tr>
            
            <!-- CTA Button -->
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <a href="https://aww.lovable.app/explore" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Full Journey →
                </a>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  You're receiving this because you follow this journey on AWW.
                </p>
                <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                  <a href="#" style="color: #6b7280;">Unsubscribe</a> · <a href="#" style="color: #6b7280;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AWW Journey <updates@awhittlewandering.com>",
      to: [profile.email],
      subject: `🗺️ Journey Update: ${journeyName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log to notification queue
    await supabase.from("notification_queue").insert({
      recipient_user_id: recipientUserId,
      journey_id: journeyId,
      notification_type: "digest",
      title: `Journey Digest: ${journeyName}`,
      body: `${highlights.length} new updates`,
      channels: ["email"],
      sent: true,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-email-digest function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
