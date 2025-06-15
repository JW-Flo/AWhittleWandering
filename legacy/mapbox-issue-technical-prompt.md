# Mapbox Token Initialization Issue in React/Vite Production Builds

## Problem Summary

We have a React application built with Vite that displays a Mapbox GL map. While the map loads correctly in development mode, production builds deployed to Cloudflare Pages consistently fail with "Mapbox access token is missing" errors. We need to identify why our token management approach works in development but fails in production.

## Current Implementation

We've implemented multiple layers of token management:

1. **HTML Head Script**:
```html
<head>
  <meta name="mapbox-token" content="pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA">
  <script>
    window.__MAPBOX_TOKEN__ = "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA";
    if (typeof mapboxgl !== 'undefined') {
      mapboxgl.accessToken = window.__MAPBOX_TOKEN__;
    }
  </script>
</head>
```

2. **Centralized Token Module**:
```typescript
// src/shared/mapbox/mapboxConfig.ts
export const getMapboxToken = (): string => {
  if (typeof window !== 'undefined' && window.__MAPBOX_TOKEN__) {
    return window.__MAPBOX_TOKEN__;
  }
  return 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';
};
```

3. **Early Initialization in Component**:
```jsx
// src/components/Map.jsx
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '../shared/mapbox/mapboxConfig';

// Self-executing function to set token early
(function() {
  const token = getMapboxToken();
  mapboxgl.accessToken = token;
})();

const Map = () => {
  // Map component implementation
};
```

4. **Vite Configuration**:
```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
        env.VITE_MAPBOX_TOKEN || 
        "pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA"
      )
    }
  };
});
```

## Technical Investigation Focus Areas

1. **Build Process Impact**: How does Vite's production build process affect the execution order of scripts that set the Mapbox token? Could tree-shaking or code splitting be removing critical token-setting code?

2. **Module Initialization Timing**: Is the imported mapboxgl module being initialized before our token-setting code runs in production builds?

3. **CSS Loading Order**: Could the CSS import order affect Mapbox initialization, and if so, what's the proper way to ensure CSS is loaded first?

4. **Environment Variable Processing**: How does Vite handle environment variables in production builds compared to development, and might this cause the token to be unavailable?

5. **Cloudflare Pages Specifics**: Are there any Cloudflare Pages-specific issues with script execution or environment variable handling that could affect Mapbox token initialization?

6. **Production-Only vs. Development-Only Code**: What parts of our code might be behaving differently between development and production due to Vite's build optimizations?

7. **Token Verification Methods**: What's the most reliable way to verify that a Mapbox token is correctly set before map initialization in both development and production?

## Required Solution Characteristics

The ideal solution should:

1. Guarantee token availability before map initialization in all environments
2. Be resilient to build optimizations like tree-shaking and code splitting
3. Work consistently across development and production builds
4. Follow best practices for React/Vite applications
5. Include proper error handling and diagnostic capabilities

## Research Questions

1. What are the recommended best practices for managing Mapbox tokens in React/Vite applications?
2. How do other developers handle similar issues with API tokens in production Vite builds?
3. Are there known issues with Mapbox GL JS initialization in bundled/minified production code?
4. What diagnostic techniques can help pinpoint exactly where and when the token is lost?
5. What are the different approaches to ensure CSS is properly loaded before map initialization?

I appreciate any technical insights, code examples, or strategies that could help resolve this persistent production-only issue.
