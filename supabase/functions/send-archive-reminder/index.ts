import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  recipientUserId: string;
  userName: string;
  notificationType: "account_inactive" | "deletion_warning" | "journey_deleted";
  title: string;
  body: string;
  journeyId?: string;
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

    const { recipientUserId, userName, notificationType, title, body, journeyId }: ReminderRequest = await req.json();

    // Get email from auth.users using service role
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(recipientUserId);
    
    if (authError || !authUser?.user?.email) {
      console.log("No email found for user:", recipientUserId);
      return new Response(JSON.stringify({ skipped: true, reason: "No email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = authUser.user.email;

    // Check if user has email enabled
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", recipientUserId)
      .single();

    if (prefs && !prefs.email_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "Email disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unsubscribe token (base64 of user_id)
    const unsubscribeToken = btoa(recipientUserId);
    const unsubscribeUrl = `https://www.awhittlewandering.com/settings?unsubscribe=${unsubscribeToken}`;
    const preferencesUrl = `https://www.awhittlewandering.com/settings`;
    const loginUrl = `https://www.awhittlewandering.com/auth`;

    // Email templates based on type
    const templates: Record<string, { subject: string; content: string; ctaText: string; ctaUrl: string }> = {
      account_inactive: {
        subject: "⚠️ Your AWW account is inactive",
        content: `
          <p>We noticed you haven't logged into A Whittle Wandering in a while.</p>
          <p><strong>Your archived journeys will be permanently deleted in 90 days</strong> unless you log in to keep your account active.</p>
          <p>Don't lose your adventure memories! Simply log in to reset the clock, or export your data before it's gone.</p>
        `,
        ctaText: "Log In Now →",
        ctaUrl: loginUrl,
      },
      deletion_warning: {
        subject: "🚨 Your journey data will be deleted in 2 weeks",
        content: `
          <p>${body}</p>
          <p>This is your final reminder. Once deleted, your journey data <strong>cannot be recovered</strong>.</p>
          <p>To keep your data:</p>
          <ul style="margin: 16px 0; padding-left: 24px;">
            <li>Log in and restore the journey from archive</li>
            <li>Or export your data as JSON/CSV for safekeeping</li>
          </ul>
        `,
        ctaText: "Save Your Data →",
        ctaUrl: loginUrl,
      },
      journey_deleted: {
        subject: "Your archived journey has been deleted",
        content: `
          <p>${body}</p>
          <p>If you'd like to start tracking new adventures, we'd love to have you back!</p>
        `,
        ctaText: "Start a New Journey →",
        ctaUrl: loginUrl,
      },
    };

    const template = templates[notificationType];

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
              <td style="background: linear-gradient(135deg, #d97706 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🗺️ A Whittle Wandering</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 30px 20px;">
                <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Hey ${userName},</p>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                  ${template.content}
                </div>
              </td>
            </tr>
            
            <!-- CTA Button -->
            <tr>
              <td style="padding: 0 20px 30px; text-align: center;">
                <a href="${template.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${template.ctaText}
                </a>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  You're receiving this because you have an account on AWW.
                </p>
                <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                  <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from emails</a>
                  &nbsp;·&nbsp;
                  <a href="${preferencesUrl}" style="color: #6b7280; text-decoration: underline;">Manage preferences</a>
                </p>
                <p style="margin: 12px 0 0; color: #d1d5db; font-size: 11px;">
                  A Whittle Wandering · Track your adventures across the world
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AWW <notifications@awhittlewandering.com>",
      to: [email],
      subject: template.subject,
      html: emailHtml,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    console.log(`Archive reminder email sent to ${email}:`, emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-archive-reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
