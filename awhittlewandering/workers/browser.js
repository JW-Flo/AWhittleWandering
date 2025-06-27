/**
 * Browser Worker - Handles browser rendering for awhittlewandering.com/render/*
 *
 * Responsibilities:
 * - Headless browser screenshot/PDF generation
 * - OG image generation
 * - DOM automation flows
 * - Uses Cloudflare's Browser Rendering API
 */
import { Router } from "itty-router";
// Create a new router
const router = Router();
// Set security headers for all responses
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
// Supported formats for screenshots and PDFs
var OutputFormat;
(function (OutputFormat) {
  OutputFormat["PNG"] = "png";
  OutputFormat["JPEG"] = "jpeg";
  OutputFormat["WEBP"] = "webp";
  OutputFormat["PDF"] = "pdf";
})(OutputFormat || (OutputFormat = {}));
/**
 * Helper to create JSON responses
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...SECURITY_HEADERS,
    },
  });
}
/**
 * Helper to create binary responses (images, PDFs)
 */
function binaryResponse(data, contentType, filename) {
  const headers = {
    "Content-Type": contentType,
    ...SECURITY_HEADERS,
  };
  if (filename) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }
  return new Response(data, { headers });
}
/**
 * Authentication middleware for render endpoints
 */
async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  if (token !== env.MCP_API_KEY) {
    return new Response("Forbidden", { status: 403 });
  }
}
/**
 * Root endpoint - provides basic info
 */
router.get("/render", () => {
  return jsonResponse({
    name: "A Whittle Wandering Browser Rendering API",
    endpoints: [
      {
        path: "/render/screenshot",
        method: "GET",
        description: "Take a screenshot of a URL",
        auth: true,
      },
      {
        path: "/render/pdf",
        method: "GET",
        description: "Generate a PDF from a URL",
        auth: true,
      },
      {
        path: "/render/og-image",
        method: "GET",
        description: "Generate an Open Graph image",
        auth: true,
      },
    ],
  });
});
/**
 * Generate a screenshot of a URL
 * Query parameters:
 * - url: The URL to screenshot (required)
 * - format: Output format (png, jpeg, webp) - default: png
 * - width: Viewport width - default: 1280
 * - height: Viewport height - default: 800
 * - fullPage: Whether to capture the full page - default: false
 * - download: Whether to download the image - default: false
 */
router.get("/render/screenshot", async (request, env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return jsonResponse(
        {
          error: "Missing required parameter: url",
        },
        400
      );
    }
    // Validate the URL
    try {
      new URL(targetUrl);
    } catch (error) {
      return jsonResponse(
        {
          error: "Invalid URL provided",
        },
        400
      );
    }
    // Parse screenshot options
    const format = url.searchParams.get("format") || OutputFormat.PNG;
    const width = parseInt(url.searchParams.get("width") || "1280", 10);
    const height = parseInt(url.searchParams.get("height") || "800", 10);
    const fullPage = url.searchParams.get("fullPage") === "true";
    const download = url.searchParams.get("download") === "true";
    // Validate format
    if (
      ![OutputFormat.PNG, OutputFormat.JPEG, OutputFormat.WEBP].includes(format)
    ) {
      return jsonResponse(
        {
          error: "Invalid format. Supported formats: png, jpeg, webp",
        },
        400
      );
    }
    // Connect to the browser
    const browser = env.BROWSER;
    if (!browser) {
      return jsonResponse(
        {
          error: "Browser Rendering API is not configured",
        },
        501
      );
    }
    // Take the screenshot
    const screenshot = await browser.run(
      {
        timeout: 30000,
        viewport: { width, height },
      },
      async (instance) => {
        const page = await instance.newPage();
        await page.goto(targetUrl, { waitUntil: "networkidle0" });
        // Wait an extra second for any animations to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Take the screenshot
        const buffer = await page.screenshot({
          fullPage,
          type: format === OutputFormat.WEBP ? OutputFormat.PNG : format, // screenshot() doesn't support webp directly
        });
        await page.close();
        return buffer;
      }
    );
    // Since screenshot() doesn't support webp, if format is webp, serve as PNG with correct content-type and extension
    let contentType;
    let actualFormat = format;
    if (format === OutputFormat.WEBP) {
      contentType = "image/png";
      actualFormat = OutputFormat.PNG;
    } else if (format === OutputFormat.JPEG) {
      contentType = "image/jpeg";
    } else {
      contentType = "image/png";
    }
    // Return the screenshot
    const filename = download
      ? `screenshot-${new Date().toISOString().split("T")[0]}.${actualFormat}`
      : undefined;
    return binaryResponse(screenshot, contentType, filename);
  } catch (error) {
    console.error("Error generating screenshot:", error);
    return jsonResponse(
      {
        error: "Failed to generate screenshot",
      },
      500
    );
  }
});
/**
 * Generate a PDF from a URL
 * Query parameters:
 * - url: The URL to generate a PDF from (required)
 * - format: Paper format (a4, letter, etc.) - default: a4
 * - landscape: Whether to use landscape orientation - default: false
 * - printBackground: Whether to print background graphics - default: true
 * - download: Whether to download the PDF - default: false
 */
router.get("/render/pdf", async (request, env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return jsonResponse(
        {
          error: "Missing required parameter: url",
        },
        400
      );
    }
    // Validate the URL
    try {
      new URL(targetUrl);
    } catch (error) {
      return jsonResponse(
        {
          error: "Invalid URL provided",
        },
        400
      );
    }
    // Parse PDF options
    const format = url.searchParams.get("format") || "a4";
    const landscape = url.searchParams.get("landscape") === "true";
    const printBackground = url.searchParams.get("printBackground") !== "false"; // default to true
    const download = url.searchParams.get("download") === "true";
    // Connect to the browser
    const browser = env.BROWSER;
    if (!browser) {
      return jsonResponse(
        {
          error: "Browser Rendering API is not configured",
        },
        501
      );
    }
    // Generate the PDF
    const pdf = await browser.run(
      {
        timeout: 30000,
      },
      async (instance) => {
        const page = await instance.newPage();
        await page.goto(targetUrl, { waitUntil: "networkidle0" });
        // Wait an extra second for any final rendering
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Generate the PDF
        const buffer = await page.pdf({
          format,
          landscape,
          printBackground,
        });
        await page.close();
        return buffer;
      }
    );
    // Return the PDF
    const filename = download
      ? `document-${new Date().toISOString().split("T")[0]}.pdf`
      : undefined;
    return binaryResponse(pdf, "application/pdf", filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return jsonResponse(
      {
        error: "Failed to generate PDF",
      },
      500
    );
  }
});
/**
 * Generate an Open Graph image for social media
 * Query parameters:
 * - title: The title to display (required)
 * - description: A description to display (optional)
 * - imageUrl: Background image URL (optional)
 * - download: Whether to download the image - default: false
 */
router.get("/render/og-image", async (request, env) => {
  // Check authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const url = new URL(request.url);
    const title = url.searchParams.get("title");
    if (!title) {
      return jsonResponse(
        {
          error: "Missing required parameter: title",
        },
        400
      );
    }
    const description = url.searchParams.get("description") || "";
    const imageUrl = url.searchParams.get("imageUrl") || "";
    const download = url.searchParams.get("download") === "true";
    // Connect to the browser
    const browser = env.BROWSER;
    if (!browser) {
      return jsonResponse(
        {
          error: "Browser Rendering API is not configured",
        },
        501
      );
    }
    // Generate the OG image
    const ogImage = await browser.run(
      {
        timeout: 30000,
        viewport: { width: 1200, height: 630 },
      },
      async (instance) => {
        const page = await instance.newPage();
        // Create a simple HTML template for the OG image
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OG Image</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 630px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #1a365d;
              color: white;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .background {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              opacity: 0.3;
              background-size: cover;
              background-position: center;
              z-index: 1;
            }
            
            .content {
              z-index: 2;
              padding: 2rem;
              background-color: rgba(0, 0, 0, 0.7);
              border-radius: 0.5rem;
              max-width: 80%;
            }
            
            h1 {
              font-size: 3.5rem;
              margin-bottom: 1rem;
            }
            
            p {
              font-size: 1.5rem;
              margin: 0;
            }
            
            .logo {
              position: absolute;
              bottom: 2rem;
              right: 2rem;
              font-size: 1.25rem;
              font-weight: bold;
              z-index: 3;
            }
          </style>
        </head>
        <body>
          ${imageUrl ? `<div class="background" style="background-image: url('${imageUrl}')"></div>` : ""}
          <div class="content">
            <h1>${title}</h1>
            ${description ? `<p>${description}</p>` : ""}
          </div>
          <div class="logo">A Whittle Wandering</div>
        </body>
        </html>
      `;
        await page.evaluate((content) => {
          document.documentElement.innerHTML = content;
        }, html);
        // Wait for any images to load
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Take the screenshot
        const buffer = await page.screenshot({
          type: "png",
        });
        await page.close();
        return buffer;
      }
    );
    // Return the OG image
    const filename = download
      ? `og-image-${new Date().toISOString().split("T")[0]}.png`
      : undefined;
    return binaryResponse(ogImage, "image/png", filename);
  } catch (error) {
    console.error("Error generating OG image:", error);
    return jsonResponse(
      {
        error: "Failed to generate OG image",
      },
      500
    );
  }
});
/**
 * 404 handler for any unmatched routes
 */
router.all("*", () => {
  return jsonResponse(
    {
      error: "Endpoint not found",
    },
    404
  );
});
/**
 * Main handler for Browser Worker requests
 */
export default {
  async fetch(request, env, ctx) {
    // Set CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    // Handle OPTIONS requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    // Route the request through our router
    try {
      const response = await router.handle(request, env);
      // Add CORS headers to the response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
