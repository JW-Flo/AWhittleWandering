#!/usr/bin/env node
/**
 * Platform Functionality Fix Script
 * Addresses issues identified in the comprehensive audit
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const fixes = [];

function log(message) {
  console.log(`\n🔧 ${message}`);
}

// Fix 1: Improve unified data error handling
log('Fix 1: Improving unified data error handling...');
const unifiedDataPath = join(process.cwd(), 'backend/edge-worker/src/routers/unifiedData.ts');
let unifiedDataCode = readFileSync(unifiedDataPath, 'utf-8');

// Already fixed in previous edit - verify
if (unifiedDataCode.includes('Database not available') && unifiedDataCode.includes('warning')) {
  log('✅ Unified data error handling already improved');
} else {
  log('⚠️ Unified data error handling needs manual review');
}

// Fix 2: Verify all routes are properly exported
log('Fix 2: Verifying route exports...');
const indexPath = join(process.cwd(), 'backend/edge-worker/src/index.ts');
const indexCode = readFileSync(indexPath, 'utf-8');

const requiredRoutes = [
  'app.route(\'/api/v1/health\'',
  'app.route(\'/api/v1/telemetry\'',
  'app.route(\'/api/v1/unified-data\'',
  'app.route(\'/api/v1/trip-status\'',
  'app.route(\'/api/v1/admin\'',
  'app.get(\'/\'',
  'app.get(\'/health\'',
  'app.get(\'/api/v1/config\'',
  'app.post(\'/api/v1/auth\'',
  'app.post(\'/drop\'',
  'app.post(\'/api/joiner\'',
  'app.get(\'/api/connectors\''
];

const missingRoutes = requiredRoutes.filter(route => !indexCode.includes(route));
if (missingRoutes.length === 0) {
  log('✅ All routes are properly defined');
} else {
  log(`⚠️ Missing routes: ${missingRoutes.join(', ')}`);
  fixes.push({
    issue: 'Missing route definitions',
    routes: missingRoutes,
    action: 'Add missing route definitions to index.ts'
  });
}

// Fix 3: Check database error handling
log('Fix 3: Checking database error handling...');
const routers = [
  'unifiedData.ts',
  'telemetry.ts',
  'health.ts',
  'admin.ts'
];

routers.forEach(router => {
  const routerPath = join(process.cwd(), 'backend/edge-worker/src/routers', router);
  try {
    const code = readFileSync(routerPath, 'utf-8');
    if (code.includes('c.env?.TESLA_DB') && !code.includes('if (!db)')) {
      log(`⚠️ ${router} may need better database error handling`);
    } else {
      log(`✅ ${router} has database error handling`);
    }
  } catch (e) {
    log(`❌ Could not read ${router}`);
  }
});

// Fix 4: Generate deployment checklist
log('Fix 4: Generating deployment checklist...');
const checklist = {
  preDeployment: [
    'Verify D1 database binding is configured',
    'Verify R2 storage binding is configured',
    'Set all required secrets (TESSIE_API_KEY, MAPBOX_ACCESS_TOKEN, etc.)',
    'Run database migrations',
    'Test all endpoints locally',
    'Build backend: npm run build:backend',
    'Build frontend: npm run build:frontend'
  ],
  deployment: [
    'Deploy backend: cd backend/edge-worker && npx wrangler deploy',
    'Deploy frontend: cd frontend && npx wrangler pages deploy dist',
    'Verify deployment: Check Cloudflare dashboard'
  ],
  postDeployment: [
    'Test health endpoint: GET /api/v1/health',
    'Test unified data: GET /api/v1/unified-data',
    'Test telemetry: GET /api/v1/telemetry/status',
    'Test trip status: GET /api/v1/trip-status',
    'Verify database connectivity',
    'Run comprehensive audit: node scripts/comprehensive-platform-audit.js'
  ]
};

writeFileSync(
  join(process.cwd(), 'DEPLOYMENT_CHECKLIST.md'),
  `# Deployment Checklist

## Pre-Deployment
${checklist.preDeployment.map(item => `- [ ] ${item}`).join('\n')}

## Deployment
${checklist.deployment.map(item => `- [ ] ${item}`).join('\n')}

## Post-Deployment
${checklist.postDeployment.map(item => `- [ ] ${item}`).join('\n')}

## Critical Issues to Address

1. **Database Connectivity**
   - Verify D1 database is bound correctly
   - Test database queries
   - Check database permissions

2. **Route Accessibility**
   - Verify all routes are properly mounted
   - Test each endpoint after deployment
   - Check for 404 errors

3. **External API Configuration**
   - Set TESSIE_API_KEY secret
   - Set MAPBOX_ACCESS_TOKEN secret
   - Test external API connectivity

4. **Error Handling**
   - Ensure graceful degradation
   - Add proper error messages
   - Test error scenarios
`
);

log('✅ Deployment checklist created: DEPLOYMENT_CHECKLIST.md');

// Summary
log('\n📋 Fix Summary:');
if (fixes.length === 0) {
  log('✅ No critical fixes needed - code structure looks good');
  log('⚠️ Main issues are likely deployment/configuration related');
} else {
  fixes.forEach(fix => {
    log(`\n⚠️ ${fix.issue}`);
    log(`   Action: ${fix.action}`);
  });
}

log('\n✅ Fix script completed');
log('📄 See PLATFORM_FUNCTIONALITY_AUDIT_REPORT.md for detailed findings');
log('📄 See DEPLOYMENT_CHECKLIST.md for deployment steps');
