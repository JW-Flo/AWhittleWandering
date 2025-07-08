# Mapbox Token Integration Issue in React/Vite Production Environment

## Background Context

I'm developing a React application using Vite that tracks a Tesla road trip through all 48 contiguous states ("The Wandering Whittle" project). The application includes a map component using Mapbox GL JS that displays the journey route, current vehicle location, and charging stations.

While the map works properly in development environments, it consistently fails in production builds deployed to Cloudflare Pages with the error: "Mapbox access token is missing" or sometimes just a blank map. This happens despite multiple attempts to properly configure the token.

## Technical Environment

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.3
- **Map Library**: Mapbox GL JS v3.4.0
- **Deployment**: Cloudflare Pages
- **Source Control**: Git
- **Environment Variables**: Using Vite's import.meta.env approach

## Code Architecture

1. **MapboxConfig** (`src/shared/mapbox/mapboxConfig.ts`):
   - Central configuration file for Mapbox-related settings
   - Contains function `getMapboxToken()` that should retrieve the token
   - Includes fallback mechanism to a hardcoded token

2. **Map Component** (`src/components/Map.jsx`):
   - Primary React component that renders the Mapbox map
   - Initializes mapboxgl.accessToken at component load time
   - Contains error handling for token-related issues

3. **Environment Setup**:
   - `.env` file contains `VITE_MAPBOX_TOKEN=pk.eyJ1I...`
   - `vite.config.js` includes define plugin for `import.meta.env.VITE_MAPBOX_TOKEN`
   - HTML template has meta tag and script injecting token to window.__MAPBOX_TOKEN__

## Issue Details

1. **Exact Error Messages**:
   - Console: "Mapbox access token is missing" 
   - UI: Map area shows loading spinner indefinitely or is blank
   - Network tab: 401 errors for Mapbox tile requests

2. **Reproduction**:
   - Issue only occurs in production builds
   - Local `bun run build && bun run preview` sometimes works
   - Cloudflare Pages deployments consistently fail

3. **Troubleshooting Steps Attempted**:
   - Hardcoded the token in multiple locations
   - Added token to HTML before React loads
   - Verified token validity via direct API calls
   - Added extensive console logging
   - Created simplified test cases

4. **Code Samples (Relevant Sections)**:

```typescript
// mapboxConfig.ts
export const getMapboxToken = (): string => {
  // Check for window global injection (highest priority)
  if (typeof window !== 'undefined' && window.__MAPBOX_TOKEN__) {
    console.log('Using Mapbox token from window.__MAPBOX_TOKEN__');
    return window.__MAPBOX_TOKEN__;
  }
  
  // Always use hardcoded token as fallback to guarantee availability
  return 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';
};
```

```jsx
// Map.jsx initialization
(function initializeMapboxToken() {
  const token = getMapboxToken();
  mapboxgl.accessToken = token;
  if (typeof window !== 'undefined') {
    window.__MAPBOX_TOKEN__ = token;
  }
})();
```

```js
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
        env.VITE_MAPBOX_TOKEN || 
        "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA"
      ),
    }
  }
});
```

```html
<!-- index.html -->
<head>
  <meta name="mapbox-token" content="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA">
  <script>
    window.__MAPBOX_TOKEN__ = "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA";
  </script>
</head>
```

## Key Hypotheses

1. **Build Process Interference**:
   - Vite's production build might be stripping out environment variables
   - Tree-shaking might be removing code that sets the token
   - Minification might be causing unexpected behavior

2. **Load Order Issues**:
   - Mapbox library might be initializing before token is set
   - React hydration might be causing token to be lost
   - CSP or other security features might block inline scripts

3. **Environment Differences**:
   - Cloudflare Pages might have unique environment variable handling
   - CSP or other security policies might differ in production
   - Bundling behavior might differ between local and deployed builds

## Research Objectives

1. **Root Cause Analysis**:
   - Identify exactly why the token is not available in production builds
   - Determine at which point in the execution flow the token is lost
   - Understand differences between development and production environments

2. **Best Practices Investigation**:
   - Research recommended patterns for Mapbox token handling in production React apps
   - Identify common pitfalls and solutions in Vite/React/Mapbox integration
   - Find examples of similar issues and their resolutions

3. **Solution Design**:
   - Develop a robust, multi-layered approach to token management
   - Create a solution compatible with Vite's production builds
   - Ensure the solution works consistently across environments

4. **Validation Framework**:
   - Design tests to verify token availability at different stages
   - Create diagnostics to pinpoint exactly where token is lost
   - Establish monitoring to ensure ongoing reliability

## Additional Context

- The project follows a strict error handling protocol with fallbacks
- Security requirements prevent storing the token in public repositories
- The application has complex state management and real-time data
- Performance is critical as the map displays live vehicle tracking

## Expected Output

1. A comprehensive analysis of potential causes for the Mapbox token issue
2. Multiple solution approaches with pros and cons of each
3. Specific code examples implementing the recommended solutions
4. Diagnostic techniques to validate the fix across environments
5. Best practices for managing API tokens in React/Vite production builds
6. References to authoritative sources, documentation, and similar case studies

I appreciate any in-depth technical investigation that can help resolve this persistent issue that's blocking our production deployment.
