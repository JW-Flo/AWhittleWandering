import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BetaInviteRequest {
  email: string;
  name: string;
  accessCode: string;
  adminKey?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const { email, name, accessCode, adminKey }: BetaInviteRequest = await req.json();

    // Internal admin function - called from admin dashboard or direct curl

    const siteUrl = Deno.env.get("SITE_URL") || "https://www.awhittlewandering.com";

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
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 You're Invited!</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">A Whittle Wandering Beta</p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0; color: #374151; font-size: 18px;">Hey ${name}! 👋</p>
                <p style="margin: 16px 0 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  You've been invited to join the exclusive beta of <strong>A Whittle Wandering</strong> — a journey tracking app for electric vehicle adventures across America.
                </p>
                
                <p style="margin: 24px 0 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Follow Joe's 48-state EV road trip in real-time, explore waypoints, and see the adventure unfold on an interactive map.
                </p>
                
                <!-- Access Code Box -->
                <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #d1fae5 100%); border-radius: 12px; text-align: center;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Your Beta Access Code</p>
                  <p style="margin: 12px 0 0; color: #1f2937; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 0.1em;">${accessCode}</p>
                </div>
                
                <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                  Use this code along with your email to sign in.
                </p>
              </td>
            </tr>
            
            <!-- CTA Button -->
            <tr>
              <td style="padding: 0 30px 40px; text-align: center;">
                <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
                  Start Exploring →
                </a>
              </td>
            </tr>
            
            <!-- What's Included -->
            <tr>
              <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px;">What you can do:</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>🗺️ Explore the interactive journey map</li>
                  <li>📍 View all waypoints and charging stops</li>
                  <li>📸 Browse photos from the adventure</li>
                  <li>⚡ Track real-time vehicle telemetry</li>
                  <li>🌤️ See weather conditions at each location</li>
                </ul>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #1f2937; padding: 24px 30px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  A Whittle Wandering · Track adventures across America
                </p>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 11px;">
                  Questions? Reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "A Whittle Wandering <hello@awhittlewandering.com>",
      to: [email],
      subject: "🎉 You're Invited to the AWW Beta!",
      html: emailHtml,
    });

    console.log("Beta invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending beta invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
