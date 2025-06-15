/**
 * Mapbox Diagnostics Utility
 *
 * Provides runtime diagnostics and verification of Mapbox token availability
 * This tool helps identify and resolve token initialization issues.
 */

/* eslint-env browser */
import { getMapboxToken } from "./environmentConfig";

/**
 * Reports detailed token information to the console
 * @returns {Object} Diagnostic information about the token
 */
export const reportTokenStatus = () => {
  // Check all possible token sources
  const metaToken =
    typeof document !== "undefined"
      ? document
          .querySelector('meta[name="mapbox-token"]')
          ?.getAttribute("content")
      : null;

  const windowToken =
    typeof window !== "undefined" ? window.__MAPBOX_TOKEN__ : null;
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const mappedToken = getMapboxToken();

  // Safely check the mapboxgl global
  let mapboxGlToken = null;
  try {
    if (typeof window !== "undefined" && window.mapboxgl) {
      mapboxGlToken = window.mapboxgl.accessToken;
    }
  } catch (e) {
    console.warn("Could not access mapboxgl.accessToken", e);
  }

  const diagnostics = {
    metaTag: {
      exists: !!metaToken,
      valid: metaToken?.startsWith("pk."),
      preview: metaToken ? `${metaToken.substring(0, 10)}...` : null,
    },
    windowGlobal: {
      exists: !!windowToken,
      valid: windowToken?.startsWith("pk."),
      preview: windowToken ? `${windowToken.substring(0, 10)}...` : null,
    },
    envVariable: {
      exists: !!envToken,
      valid: envToken?.startsWith("pk."),
      preview: envToken ? `${envToken.substring(0, 10)}...` : null,
    },
    configuredToken: {
      exists: !!mappedToken,
      valid: mappedToken?.startsWith("pk."),
      preview: mappedToken ? `${mappedToken.substring(0, 10)}...` : null,
    },
    mapboxGl: {
      exists: !!mapboxGlToken,
      valid: mapboxGlToken?.startsWith("pk."),
      preview: mapboxGlToken ? `${mapboxGlToken.substring(0, 10)}...` : null,
    },
  };

  // Log detailed diagnostics
  console.group("🗺️ Mapbox Token Diagnostics");
  console.log("Environment:", import.meta.env.MODE);
  console.table(diagnostics);

  // Identify issues
  const issues = [];
  if (!diagnostics.configuredToken.exists)
    issues.push("Token not available from environmentConfig");
  if (!diagnostics.mapboxGl.exists) issues.push("mapboxgl.accessToken not set");
  if (!diagnostics.envVariable.exists)
    issues.push("VITE_MAPBOX_TOKEN env variable not injected");

  if (issues.length > 0) {
    console.warn("⚠️ Mapbox token issues detected:", issues);
  } else {
    console.log("✅ Mapbox token verified on all sources");
  }
  console.groupEnd();

  return diagnostics;
};

/**
 * Ensures the Mapbox token is set in all required contexts
 * @returns {boolean} True if token was successfully synchronized across contexts
 */
export const synchronizeTokens = () => {
  const token = getMapboxToken();

  if (!token || !token.startsWith("pk.")) {
    console.error("❌ Critical error: Could not obtain valid Mapbox token");
    return false;
  }

  try {
    // Set on mapboxgl global
    if (typeof window !== "undefined" && window.mapboxgl) {
      window.mapboxgl.accessToken = token;
    }

    // Set on window global for cross-module use
    if (typeof window !== "undefined") {
      window.__MAPBOX_TOKEN__ = token;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to synchronize Mapbox token:", error);
    return false;
  }
};

export default {
  reportTokenStatus,
  synchronizeTokens,
};
