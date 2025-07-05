# Deep Technical Analysis Request: Mapbox Token Integration in Vite/React Production Environment

## Core Issue Definition

I'm experiencing persistent "Mapbox access token is missing" errors in a production React/Vite application deployed to Cloudflare Pages. Despite implementing multiple token injection strategies, the map fails to load only in production builds, while working perfectly in development. I need a comprehensive investigation into potential root causes and systematic solutions.

## Technical Stack & Architecture

### Frontend Framework
- React 18.2.0
- TypeScript 5.2.0
- Vite 6.3.5
- Mapbox GL JS 3.4.0
- CSS Modules

### Deployment Pipeline
- GitHub Actions CI/CD
- Cloudflare Pages (production)
- Custom wrangler deployment script
- Environment variable injection at build time

### Application Structure
```
/src
  /components
    Map.jsx              # Main map component
    MapErrorBoundary.jsx # Error handling wrapper
  /shared
    /mapbox
      mapboxConfig.ts    # Central token management
  /utils
    mapUtils.js          # Map utilities
  /hooks
    useMapInitialization.js
  App.jsx
  index.jsx
/public
  index.html             # Contains token injection script
vite.config.js           # Build configuration
.env                     # Environment variables
```

## Token Management Implementation

I've implemented a multi-layered token management system with several fallback mechanisms:

### 1. HTML-Level Initialization (Earliest)
```html
<!-- public/index.html -->
<head>
  <!-- Mapbox token - multiple safeguards to ensure availability -->
  <meta name="mapbox-token" content="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA">
  <!-- Inject token to window object as early as possible -->
  <script>
    // Guaranteed token availability before any map initialization
    window.__MAPBOX_TOKEN__ = "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA";
    
    // Additional safeguards for Mapbox 
    if (typeof mapboxgl !== 'undefined') {
      mapboxgl.accessToken = window.__MAPBOX_TOKEN__;
    }
    
    // Debug flag for development
    window.__MAP_DEBUG__ = true;
    console.log("[Mapbox Token Injection] Token set on window.__MAPBOX_TOKEN__");
  </script>
</head>
```

### 2. Centralized Token Management
```typescript
// mapboxConfig.ts
declare global {
  interface Window {
    __MAPBOX_TOKEN__?: string;
    __MAP_DEBUG__?: boolean;
  }
}

// IMPORTANT: Hardcoded production token that will always be available
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';

export const getMapboxToken = (): string => {
  // Check for window global injection (highest priority)
  if (typeof window !== 'undefined' && window.__MAPBOX_TOKEN__) {
    console.log('Using Mapbox token from window.__MAPBOX_TOKEN__');
    return window.__MAPBOX_TOKEN__;
  }
  
  // Always use hardcoded token as fallback to guarantee availability
  return MAPBOX_TOKEN;
};
```

### 3. Component-Level Initialization
```jsx
// Map.jsx
import { getMapboxToken } from '../shared/mapbox/mapboxConfig.ts';

/**
 * Initialize Mapbox Token early to guarantee it's set before map initialization
 * Using a self-executing function to ensure this runs at module load time
 */
(function initializeMapboxToken() {
  // Get token from our centralized token management system
  const token = getMapboxToken();
  
  // Set token on mapboxgl
  mapboxgl.accessToken = token;
  
  // Also set it on window for debugging and as an additional fallback
  if (typeof window !== 'undefined') {
    window.__MAPBOX_TOKEN__ = token;
  }
  
  // Diagnostic logging
  console.log('[MapboxGL] Token initialization complete', { 
    tokenSet: !!token,
    tokenPreview: token ? `${token.substring(0, 10)}...` : 'Missing',
    mapboxVersion: mapboxgl.version
  });
})();
```

### 4. Vite Configuration
```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
        env.VITE_MAPBOX_TOKEN ||
        env.MAPBOX_TOKEN ||
        "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA"
      ),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules/mapbox-gl")) {
              return "mapbox-core";
            }
          }
        }
      }
    }
  };
});
```

### 5. Map Initialization with Verification & Retry
```jsx
// Map component useEffect
useEffect(() => {
  // Only initialize once
  if (map.current || mapInitAttempted) return;
  
  console.log('[MapboxGL] Starting map initialization');
  setMapInitAttempted(true);
  
  // 1. Verify token with multi-level verification
  const tokenValid = verifyMapboxToken();
  if (!tokenValid) {
    console.error('[MapboxGL] Token validation failed after all attempts');
    setMapError('Mapbox access token could not be validated. Using fallback configuration.');
    // We don't return here - we'll try to initialize with our fallback token
  }

  // Setup initialization with retry mechanism
  const initMapWithRetry = (retryCount = 0) => {
    try {
      // Initialize map with direct token parameter
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283],
        zoom: 3.5,
        accessToken: mapboxgl.accessToken,
      });
      
      // Setup event handlers
      map.current.on('load', () => {
        setMapReady(true);
        setLoading(false);
      });
      
      return true;
    } catch (error) {
      console.error(`[MapboxGL] Map initialization failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < 2) {
        // Retry with exponential backoff
        const waitTime = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          initMapWithRetry(retryCount + 1);
        }, waitTime);
        return false;
      } else {
        setMapError(`Map initialization failed: ${error.message}`);
        setLoading(false);
        return false;
      }
    }
  };
  
  // Start initialization with retry
  initMapWithRetry();
}, []);
```

## Observed Behavior & Diagnostics

### Development vs. Production
- **Development**: Map loads correctly, token is properly set and verified
- **Production**: Map fails to load with "Mapbox access token is missing" error

### Browser Console Output (Production)
```
[MapboxGL] Token initialization complete {tokenSet: true, tokenPreview: "pk.eyJ1Izo…", mapboxVersion: "3.4.0"}
Mapbox GL JS warning: Missing Mapbox GL JS CSS
Error: Mapbox access token is missing
```

### Network Requests (Production)
- Requests to Mapbox tile servers return 401 Unauthorized
- No requests made to Mapbox style API

### HTML Inspection (Production)
- Token meta tag is present in source
- Script tag with window.__MAPBOX_TOKEN__ is present and executed
- Mapbox CSS is sometimes missing or loaded after map initialization

## Key Questions for Investigation

1. **Build Process Impact**:
   - How might Vite's code splitting, tree-shaking, or minification affect token availability?
   - Are there any known issues with Vite's handling of early-executed code in production builds?
   - Could the order of script evaluation in production builds differ from development?

2. **Execution Context & Timing**:
   - Is there a race condition between Mapbox initialization and token setting?
   - How does the bundled code execution order differ from the source code order?
   - Could React's hydration process interfere with the token setting?

3. **Environment Specific Issues**:
   - Are there Cloudflare Pages-specific issues with environment variables or script execution?
   - Could there be CSP or other security policies blocking access to window variables?
   - Are there any known issues with Mapbox GL JS in specific deployment environments?

4. **CSS Loading Impact**:
   - How critical is the CSS loading order for proper Mapbox initialization?
   - Could missing CSS trigger additional behavior that affects token recognition?
   - What is the proper way to ensure CSS is loaded before map initialization?

5. **Error Recovery**:
   - What are best practices for recovering from Mapbox initialization failures?
   - Are there systematic approaches to verify token availability at runtime?
   - How to implement a graceful fallback system when map initialization fails?

## Previous Attempted Solutions

1. Hardcoded the token in multiple locations
2. Added a meta tag with the token
3. Set the token on window.__MAPBOX_TOKEN__ before any script execution
4. Directly set mapboxgl.accessToken in the HTML head
5. Added verification and retry logic in the component
6. Implemented multiple fallback mechanisms
7. Included the CSS directly in the HTML and component
8. Added extensive logging to track token availability
9. Created standalone test pages that work correctly
10. Used different token setting approaches (import.meta.env, process.env, window)

## Research Objectives

1. Identify the exact point of failure in the token setting process in production builds
2. Understand differences in script execution between development and production
3. Determine best practices for Mapbox token management in Vite/React applications
4. Develop a robust solution that works consistently across environments
5. Create a systematic verification approach to validate the solution

## What I'm Looking For

1. A deep technical analysis of potential causes based on the Vite build process and React runtime
2. Proven patterns for managing Mapbox tokens in production React applications
3. Specific code examples for a comprehensive solution
4. Diagnostic approaches to verify token availability throughout the application lifecycle
5. References to similar issues and their resolutions in the React/Vite/Mapbox ecosystem

Thank you for your comprehensive investigation into this challenging issue!
