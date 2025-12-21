#!/usr/bin/env node

/**
 * Fix Cloudflare Worker bindings via API
 * Verifies/creates D1 database and R2 bucket, then adds bindings to worker
 * 
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx node scripts/fix-cloudflare-bindings-api.js
 *   Or: npm run fix:bindings (with secrets in env)
 */

import fetch from 'node-fetch';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const WORKER_NAME = 'awhittlewandering-api';
const D1_DB_NAME = 'tesla-journey-tracker';
const D1_DB_ID = '09a6ba85-bd36-4ad3-b5a8-92e230943dcb';
const R2_BUCKET_NAME = 'awhittlewandering-media';
const D1_BINDING_NAME = 'TESLA_DB';
const R2_BINDING_NAME = 'MEDIA_BUCKET';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_ACCOUNT_ID (or CF_ACCOUNT_ID)');
  console.error('   CLOUDFLARE_API_TOKEN (or CF_API_TOKEN)');
  process.exit(1);
}

const API_BASE = `https://api.cloudflare.com/client/v4`;

async function apiRequest(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function verifyD1Database() {
  console.log('📊 Checking D1 database...');
  
  try {
    const result = await apiRequest('GET', `/accounts/${ACCOUNT_ID}/d1/database/${D1_DB_ID}`);
    console.log(`   ✓ Database exists: ${result.result.name}`);
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`   ⚠ Database not found. Creating...`);
      try {
        const result = await apiRequest('POST', `/accounts/${ACCOUNT_ID}/d1/database`, {
          name: D1_DB_NAME,
        });
        console.log(`   ✓ Database created: ${result.result.name} (ID: ${result.result.uuid})`);
        console.log(`   ⚠ Note: Update wrangler.toml with new ID: ${result.result.uuid}`);
        return result.result.uuid;
      } catch (createError) {
        console.error(`   ✗ Failed to create database: ${createError.message}`);
        return false;
      }
    } else {
      console.error(`   ✗ Error checking database: ${error.message}`);
      return false;
    }
  }
}

async function verifyR2Bucket() {
  console.log('🪣 Checking R2 bucket...');
  
  try {
    const result = await apiRequest('GET', `/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}`);
    console.log(`   ✓ Bucket exists: ${result.name}`);
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`   ⚠ Bucket not found. Creating...`);
      try {
        const result = await apiRequest('POST', `/accounts/${ACCOUNT_ID}/r2/buckets`, {
          name: R2_BUCKET_NAME,
        });
        console.log(`   ✓ Bucket created: ${result.name}`);
        return true;
      } catch (createError) {
        console.error(`   ✗ Failed to create bucket: ${createError.message}`);
        return false;
      }
    } else {
      console.error(`   ✗ Error checking bucket: ${error.message}`);
      return false;
    }
  }
}

async function updateWorkerBindings() {
  console.log('🔧 Checking worker bindings...');
  
  try {
    // Get worker settings (bindings are configured via settings API)
    const settings = await apiRequest('GET', `/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/settings`);
    
    const bindings = settings.result?.bindings || [];
    const d1Bindings = bindings.filter(b => b.type === 'd1_database');
    const r2Bindings = bindings.filter(b => b.type === 'r2_bucket');
    
    const hasD1 = d1Bindings.some(b => b.name === D1_BINDING_NAME && b.database_id === D1_DB_ID);
    const hasR2 = r2Bindings.some(b => b.name === R2_BINDING_NAME && b.bucket_name === R2_BUCKET_NAME);
    
    if (hasD1 && hasR2) {
      console.log('   ✓ D1 binding configured: TESLA_DB');
      console.log('   ✓ R2 binding configured: MEDIA_BUCKET');
      return true;
    }
    
    // Build updated bindings - remove old bindings with same name, add new ones
    const updatedBindings = bindings.filter(b => 
      !(b.type === 'd1_database' && b.name === D1_BINDING_NAME) &&
      !(b.type === 'r2_bucket' && b.name === R2_BINDING_NAME)
    );
    
    if (!hasD1) {
      updatedBindings.push({
        type: 'd1_database',
        name: D1_BINDING_NAME,
        database_id: D1_DB_ID,
      });
      console.log(`   ✓ Adding D1 binding: ${D1_BINDING_NAME} → ${D1_DB_NAME}`);
    }
    
    if (!hasR2) {
      updatedBindings.push({
        type: 'r2_bucket',
        name: R2_BINDING_NAME,
        bucket_name: R2_BUCKET_NAME,
      });
      console.log(`   ✓ Adding R2 binding: ${R2_BINDING_NAME} → ${R2_BUCKET_NAME}`);
    }
    
    // Update worker settings with new bindings
    console.log('   🔄 Updating worker bindings via API...');
    const updateResult = await apiRequest('PUT', `/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/settings`, {
      bindings: updatedBindings,
    });
    
    if (updateResult.success !== false) {
      console.log('   ✓ Bindings updated successfully');
      return true;
    } else {
      throw new Error('Update returned success: false');
    }
  } catch (error) {
    console.error(`   ✗ Error updating bindings: ${error.message}`);
    console.log('   ⚠ Note: Bindings are configured in wrangler.toml');
    console.log('   ⚠ Deploy with: cd backend/edge-worker && npx wrangler deploy --env production');
    return false;
  }
}

async function main() {
  console.log('🚀 Fixing Cloudflare Worker Bindings via API\n');
  
  const d1Ok = await verifyD1Database();
  const r2Ok = await verifyR2Bucket();
  
  if (!d1Ok || !r2Ok) {
    console.error('\n❌ Failed to verify/create resources');
    process.exit(1);
  }
  
  const bindingsOk = await updateWorkerBindings();
  
  if (bindingsOk) {
    console.log('\n✅ Bindings configured! Testing connectivity...');
    console.log('   Run: npm run test:connectivity');
  } else {
    console.log('\n⚠️  Bindings may need manual configuration or deployment');
    console.log('   Deploy with: cd backend/edge-worker && npx wrangler deploy --env production');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
