# Rebranding Guide: From "48 Continental USA" to "A Whittle Wandering"

This document outlines the rebranding process from the original project name "48 Continental USA" to the new brand "A Whittle Wandering".

## Rebranding Overview

The project has been rebranded from "48 Continental USA" to "A Whittle Wandering" to better reflect its purpose and mission. The new name emphasizes the exploratory, journey-focused nature of the project while adding a touch of wordplay ("A Whittle" sounds like "A Little").

## Brand Assets

### Name Variations

- **Full Name**: "A Whittle Wandering"
- **Short Name**: "Whittle Wandering"
- **Acronym**: "AWW"
- **URL/Slug Format**: "whittle-wandering" or "awandering"

### Color Palette

| Name | Hex Code | RGB | Usage |
|------|----------|-----|-------|
| Journey Blue | #1A365D | 26, 54, 93 | Primary brand color |
| Sunrise Orange | #F9A03F | 249, 160, 63 | Accent color |
| Path Green | #3B7A57 | 59, 122, 87 | Secondary color |
| Sky Blue | #87CEEB | 135, 206, 235 | Background color |
| Asphalt Gray | #4A4A4A | 74, 74, 74 | Text color |

### Typography

- **Headings**: Montserrat Bold
- **Body Text**: Source Sans Pro
- **Accents**: Amatic SC (for a handwritten journey feel)

## Rebranding Checklist

### Code Updates

- [ ] Replace all instances of "48 Continental" and similar variations with "A Whittle Wandering"
- [ ] Update class names, variables, and function names that reference the old brand
- [ ] Rename files and directories that contain the old brand name
- [ ] Update import statements and references affected by renamed files

### UI Updates

- [ ] Update application title and headers
- [ ] Replace logo and icon assets
- [ ] Update color scheme to match new brand palette
- [ ] Update favicon and app icons
- [ ] Modify UI theme settings to reflect new brand identity

### Content Updates

- [ ] Update all user-facing text mentions of the old brand
- [ ] Revise mission statement and about sections
- [ ] Update meta descriptions and SEO content
- [ ] Replace screenshots showing the old brand name

### Configuration Updates

- [ ] Update API endpoint references
- [ ] Modify KV namespace keys that include the old brand name
- [ ] Update domain configurations and DNS settings
- [ ] Modify build and deployment scripts with new naming

## Implementation Sequence

1. **Preparation Phase**
   - Create backup of current codebase
   - Document all occurrences of old brand references
   - Prepare new brand assets

2. **Core Implementation**
   - Update core configurations
   - Modify API endpoints and services
   - Rename and restructure project files

3. **UI Implementation**
   - Update visual elements
   - Replace assets and styling
   - Implement new color scheme

4. **Testing Phase**
   - Verify all functionalities after rebranding
   - Check for broken references or links
   - Validate consistent brand appearance

5. **Deployment Phase**
   - Deploy updated code to staging environment
   - Validate in staging environment
   - Deploy to production

## Rebranding Metrics

To measure the success of the rebranding effort, track the following:

- Percentage of codebase updated with new branding
- Number of remaining references to old branding
- Build success rate after rebranding changes
- User feedback on new brand identity

## Communication Plan

1. Announce rebranding to users before implementation
2. Provide explanation of the new brand identity and meaning
3. Create temporary redirection from old brand references to new ones
4. Display transition notices during the rebranding period

## Reference Templates

### Code Reference Update Example

```javascript
// Before
const appName = "48 Continental";
const appSlug = "48continental";

// After
const appName = "A Whittle Wandering";
const appSlug = "whittle-wandering";
```

### Configuration Update Example

```json
// Before
{
  "projectName": "48Continental",
  "apiEndpoint": "api.48continental.com",
  "kvNamespace": "48CONT_VISITS"
}

// After
{
  "projectName": "WhittleWandering",
  "apiEndpoint": "api.whittlewandering.com",
  "kvNamespace": "AWW_VISITS"
}
```
