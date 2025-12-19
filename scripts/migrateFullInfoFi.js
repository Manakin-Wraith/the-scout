/**
 * Full InfoFi Migration Script
 * 
 * This script imports ALL InfoFi data into Supabase, not just users who match Scout CSVs.
 * This enables true "scouting" - discovering new talent from the InfoFi database.
 * 
 * Run with: node scripts/migrateFullInfoFi.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Supabase configuration - load from environment variables
// Create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY
import dotenv from 'dotenv';
dotenv.config({ path: path.join(ROOT_DIR, '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// CSV Parsing Utilities
// ============================================================================

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length - 1) { // Allow slightly mismatched rows
      const row = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function normalizeHandle(handle) {
  if (!handle) return null;
  return handle.toLowerCase().replace(/^@/, '').trim() || null;
}

function extractXHandle(xLink) {
  if (!xLink) return null;
  const match = xLink.match(/(?:x\.com|twitter\.com)\/([^?\/\s]+)/i);
  return match ? normalizeHandle(match[1]) : null;
}

function parseBoolean(value) {
  if (!value) return false;
  const v = value.toString().toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseNumber(value) {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseInt2(value) {
  if (!value || value === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseDate(value) {
  if (!value || value === '') return null;
  try {
    // Handle DD-MM-YYYY HH:MM format
    const match = value.match(/(\d{2})-(\d{2})-(\d{4})\s*(\d{1,2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return new Date(year, month - 1, day, hour, minute).toISOString();
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

// ============================================================================
// Data Loading
// ============================================================================

function loadCSV(filename) {
  const filepath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  File not found: ${filename}`);
    return [];
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  return parseCSV(content);
}

// ============================================================================
// Migration Functions
// ============================================================================

async function clearAllTables() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete in order respecting foreign keys
  await supabase.from('shortlist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shortlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('campaign_participation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('infofi_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('deal_takers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('dormant_influencers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('non_interactors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✅ Tables cleared');
}

async function migrateAllUsers() {
  console.log('\n📦 Phase 1: Migrating ALL users (Scout + InfoFi)...');
  
  // Load Scout CSV data
  const dealTakers = loadCSV('Scout_1_Deal_Takers.csv');
  const nonInteractors = loadCSV('Scout_2_No_Bot_Interaction.csv');
  const dormants = loadCSV('Scout_3_Dormant_Influencers.csv');
  
  // Load InfoFi data
  const infofiDetails = loadCSV('All InfoFi Data  - Serpin Data - Details.csv.csv');
  const infofiLocation = loadCSV('All InfoFi Data  - Serpin Data - Location.csv.csv');
  
  console.log(`   Scout data: ${dealTakers.length} deal takers, ${dormants.length} dormants, ${nonInteractors.length} non-interactors`);
  console.log(`   InfoFi data: ${infofiDetails.length} details, ${infofiLocation.length} locations`);
  
  // Build unified user map
  const userMap = new Map(); // key: normalized x_handle or tg:telegram_id
  const seenXHandles = new Set();
  const seenTelegramIds = new Set();
  
  // =========================================================================
  // Step 1: Process Scout Deal Takers (source = 'scout', status = 'active')
  // =========================================================================
  console.log('\n   Processing Scout Deal Takers...');
  for (const dt of dealTakers) {
    const xHandle = normalizeHandle(dt.X_Handle);
    if (xHandle && !seenXHandles.has(xHandle)) {
      seenXHandles.add(xHandle);
      userMap.set(`x:${xHandle}`, {
        x_handle: xHandle,
        x_link: `https://x.com/${xHandle}`,
        telegram_id: null,
        telegram_handle: null,
        first_name: null,
        last_name: null,
        display_name: null,
        source: 'scout',
        status: 'active',
      });
    }
  }
  console.log(`   ✓ ${seenXHandles.size} deal takers processed`);
  
  // =========================================================================
  // Step 2: Process Scout Dormants (source = 'scout', status = 'dormant')
  // =========================================================================
  console.log('   Processing Scout Dormants...');
  let dormantCount = 0;
  for (const d of dormants) {
    const xHandle = extractXHandle(d.xLink);
    const telegramId = d.telegramId?.toString();
    
    if (xHandle && userMap.has(`x:${xHandle}`)) {
      // Update existing user with telegram info
      const user = userMap.get(`x:${xHandle}`);
      if (telegramId && !seenTelegramIds.has(telegramId)) {
        user.telegram_id = telegramId;
        seenTelegramIds.add(telegramId);
      }
      user.telegram_handle = d.TG_Handle || user.telegram_handle;
      user.x_link = d.xLink || user.x_link;
    } else if (telegramId && !seenTelegramIds.has(telegramId)) {
      // Create new user
      seenTelegramIds.add(telegramId);
      if (xHandle && !seenXHandles.has(xHandle)) {
        seenXHandles.add(xHandle);
      }
      userMap.set(`tg:${telegramId}`, {
        x_handle: xHandle,
        x_link: d.xLink || null,
        telegram_id: telegramId,
        telegram_handle: d.TG_Handle || null,
        first_name: null,
        last_name: null,
        display_name: null,
        source: 'scout',
        status: 'dormant',
      });
      dormantCount++;
    }
  }
  console.log(`   ✓ ${dormantCount} new dormants added`);
  
  // =========================================================================
  // Step 3: Process Scout Non-Interactors (source = 'scout', status = 'prospect')
  // =========================================================================
  console.log('   Processing Scout Non-Interactors...');
  let niCount = 0;
  for (const ni of nonInteractors) {
    const telegramId = ni['User ID']?.toString();
    const tgUsername = ni.TG_Username;
    
    if (telegramId && !seenTelegramIds.has(telegramId)) {
      seenTelegramIds.add(telegramId);
      userMap.set(`tg:${telegramId}`, {
        x_handle: null,
        x_link: null,
        telegram_id: telegramId,
        telegram_handle: tgUsername || null,
        first_name: ni['First Name'] || null,
        last_name: ni['Last Name'] || null,
        display_name: ni['First Name'] ? `${ni['First Name']} ${ni['Last Name'] || ''}`.trim() : null,
        source: 'scout',
        status: 'prospect',
      });
      niCount++;
    }
  }
  console.log(`   ✓ ${niCount} non-interactors added`);
  
  // =========================================================================
  // Step 4: Process ALL InfoFi Details (source = 'infofi' or 'both')
  // =========================================================================
  console.log('\n   Processing ALL InfoFi Details (this is the big one)...');
  let newInfoFiCount = 0;
  let matchedCount = 0;
  
  for (const d of infofiDetails) {
    const xHandle = normalizeHandle(d.username);
    if (!xHandle) continue;
    
    if (seenXHandles.has(xHandle)) {
      // User exists from Scout - mark as 'both'
      const existingKey = userMap.has(`x:${xHandle}`) ? `x:${xHandle}` : null;
      if (existingKey) {
        const user = userMap.get(existingKey);
        user.source = 'both';
        user.display_name = d.name || user.display_name;
      }
      matchedCount++;
    } else {
      // New user from InfoFi only - this is a PROSPECT to scout!
      seenXHandles.add(xHandle);
      userMap.set(`x:${xHandle}`, {
        x_handle: xHandle,
        x_link: `https://x.com/${xHandle}`,
        telegram_id: null,
        telegram_handle: null,
        first_name: null,
        last_name: null,
        display_name: d.name || null,
        source: 'infofi',
        status: 'prospect',
      });
      newInfoFiCount++;
    }
  }
  console.log(`   ✓ ${newInfoFiCount} NEW prospects from InfoFi Details`);
  console.log(`   ✓ ${matchedCount} matched with existing Scout users`);
  
  // =========================================================================
  // Step 5: Process InfoFi Location data (may have additional users)
  // =========================================================================
  console.log('   Processing InfoFi Location data...');
  let locationNewCount = 0;
  for (const loc of infofiLocation) {
    const xHandle = normalizeHandle(loc.username);
    if (!xHandle) continue;
    
    if (!seenXHandles.has(xHandle)) {
      seenXHandles.add(xHandle);
      userMap.set(`x:${xHandle}`, {
        x_handle: xHandle,
        x_link: `https://x.com/${xHandle}`,
        telegram_id: null,
        telegram_handle: null,
        first_name: null,
        last_name: null,
        display_name: null,
        source: 'infofi',
        status: 'prospect',
      });
      locationNewCount++;
    }
  }
  console.log(`   ✓ ${locationNewCount} additional prospects from Location data`);
  
  // =========================================================================
  // Step 6: Insert all users into database
  // =========================================================================
  const users = Array.from(userMap.values());
  
  // Deduplicate by x_handle (keep first occurrence which has priority from Scout data)
  const seenInBatch = new Set();
  const dedupedUsers = users.filter(u => {
    if (u.x_handle) {
      if (seenInBatch.has(u.x_handle)) return false;
      seenInBatch.add(u.x_handle);
    }
    return true;
  });
  
  console.log(`\n   📊 Total unique users to insert: ${dedupedUsers.length} (deduped from ${users.length})`);
  
  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < dedupedUsers.length; i += BATCH_SIZE) {
    const batch = dedupedUsers.slice(i, i + BATCH_SIZE);
    
    // Deduplicate within batch by x_handle
    const batchHandles = new Set();
    const cleanBatch = batch.filter(u => {
      if (u.x_handle) {
        if (batchHandles.has(u.x_handle)) return false;
        batchHandles.add(u.x_handle);
      }
      return true;
    });
    
    const { data, error } = await supabase.from('users').insert(cleanBatch).select('id');
    
    if (error) {
      console.error(`   ❌ Error inserting batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
      errors++;
    } else {
      inserted += data.length;
    }
    
    // Progress indicator
    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= dedupedUsers.length) {
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, dedupedUsers.length)}/${dedupedUsers.length} users...`);
    }
  }
  
  console.log(`   ✅ Inserted ${inserted} users (${errors} batch errors)`);
  return inserted;
}

async function getUserLookup() {
  console.log('\n   Building user lookup tables (fetching all users)...');
  
  const byXHandle = new Map();
  const byTelegramId = new Map();
  
  // Fetch users in batches to avoid the 1000 row limit
  const PAGE_SIZE = 1000;
  let offset = 0;
  let totalFetched = 0;
  
  while (true) {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, x_handle, telegram_id')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) {
      console.error('Failed to fetch users:', error.message);
      break;
    }
    
    if (!users || users.length === 0) break;
    
    for (const user of users) {
      if (user.x_handle) byXHandle.set(user.x_handle, user.id);
      if (user.telegram_id) byTelegramId.set(user.telegram_id, user.id);
    }
    
    totalFetched += users.length;
    offset += PAGE_SIZE;
    
    if (users.length < PAGE_SIZE) break; // Last page
  }
  
  console.log(`   ✓ Fetched ${totalFetched} users total`);
  console.log(`   ✓ Lookup ready: ${byXHandle.size} by X handle, ${byTelegramId.size} by Telegram ID`);
  return { byXHandle, byTelegramId };
}

async function migrateDealTakers(userLookup) {
  console.log('\n💰 Migrating deal takers...');
  
  const dealTakers = loadCSV('Scout_1_Deal_Takers.csv');
  const records = [];
  
  for (const dt of dealTakers) {
    const xHandle = normalizeHandle(dt.X_Handle);
    const userId = userLookup.byXHandle.get(xHandle);
    
    if (userId) {
      records.push({
        user_id: userId,
        total_earnings: parseNumber(dt.Total_Earnings) || 0,
        total_posts: parseInt2(dt.Total_Posts) || 0,
        campaigns_participated: parseInt2(dt.Campaigns_Participated) || 0,
      });
    }
  }
  
  const { error } = await supabase.from('deal_takers').insert(records);
  if (error) {
    console.error('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Inserted ${records.length} deal takers`);
  }
}

async function migrateDormants(userLookup) {
  console.log('\n🌙 Migrating dormant influencers...');
  
  const dormants = loadCSV('Scout_3_Dormant_Influencers.csv');
  const records = [];
  
  for (const d of dormants) {
    const xHandle = extractXHandle(d.xLink);
    const telegramId = d.telegramId?.toString();
    
    const userId = (xHandle && userLookup.byXHandle.get(xHandle)) || 
                   (telegramId && userLookup.byTelegramId.get(telegramId));
    
    if (userId) {
      records.push({
        user_id: userId,
        smart_followers: parseInt2(d['Smart Followers']) || 0,
        submitted_at: parseDate(d.submittedAt),
        status: 'dormant',
      });
    }
  }
  
  const { error } = await supabase.from('dormant_influencers').insert(records);
  if (error) {
    console.error('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Inserted ${records.length} dormant influencers`);
  }
}

async function migrateNonInteractors(userLookup) {
  console.log('\n📵 Migrating non-interactors...');
  
  const nonInteractors = loadCSV('Scout_2_No_Bot_Interaction.csv');
  const records = [];
  
  for (const ni of nonInteractors) {
    const telegramId = ni['User ID']?.toString();
    const userId = userLookup.byTelegramId.get(telegramId);
    
    if (userId) {
      records.push({
        user_id: userId,
        join_date: parseDate(ni['Join Date']),
      });
    }
  }
  
  const { error } = await supabase.from('non_interactors').insert(records);
  if (error) {
    console.error('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Inserted ${records.length} non-interactors`);
  }
}

async function migrateAllInfoFiProfiles(userLookup) {
  console.log('\n🔍 Migrating ALL InfoFi profiles...');
  
  // Load all InfoFi data files
  const details = loadCSV('All InfoFi Data  - Serpin Data - Details.csv.csv');
  const locations = loadCSV('All InfoFi Data  - Serpin Data - Location.csv.csv');
  const kaitoRanks = loadCSV('All InfoFi Data  - Serpin Data - Kaito.csv.csv');
  const cookieRanks = loadCSV('All InfoFi Data  - Serpin Data - Cookie.csv.csv');
  const ethosRanks = loadCSV('All InfoFi Data  - Serpin Data - Ethos.csv.csv');
  const wallchainRanks = loadCSV('All InfoFi Data  - Serpin Data - Wallchain.csv.csv');
  const galxeRanks = loadCSV('All InfoFi Data  - Serpin Data - Galxe.csv.csv');
  
  console.log(`   Loaded: ${details.length} details, ${locations.length} locations`);
  console.log(`   Rankings: Kaito=${kaitoRanks.length}, Cookie=${cookieRanks.length}, Ethos=${ethosRanks.length}, Wallchain=${wallchainRanks.length}, Galxe=${galxeRanks.length}`);
  
  // Build lookup maps for rankings
  const kaitoMap = new Map(kaitoRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const cookieMap = new Map(cookieRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const ethosMap = new Map(ethosRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const wallchainMap = new Map(wallchainRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const galxeMap = new Map(galxeRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  
  // Build location lookup (may have ethos_score)
  const locationMap = new Map();
  for (const loc of locations) {
    const handle = normalizeHandle(loc.username);
    if (handle) {
      locationMap.set(handle, {
        location_source: loc.location_source,
        inferred_location: loc.inferred_location,
        ethos_score: parseNumber(loc.ethos_score),
      });
    }
  }
  
  // Process all details
  const records = [];
  let matched = 0;
  let skipped = 0;
  
  for (const d of details) {
    const xHandle = normalizeHandle(d.username);
    const userId = userLookup.byXHandle.get(xHandle);
    
    if (!userId) {
      skipped++;
      continue;
    }
    
    matched++;
    const locData = locationMap.get(xHandle) || {};
    
    records.push({
      user_id: userId,
      registered: d.Registered || null,
      location: d.Location || locData.inferred_location || null,
      no_vpn: parseBoolean(d.NO_VPN),
      verified: parseBoolean(d.Verified),
      username_changes: parseInt2(d['Username Changes']) || 0,
      last_username_change: parseDate(d['Last Username Change']),
      possible_bot: parseBoolean(d['Possibe Bot?']),
      ethos_score: parseNumber(d['Ethos Score']) || locData.ethos_score || null,
      kaito_sf: parseInt2(d['Kaito SF ']),
      kaito_yaps: parseInt2(d['Kaito Yaps']),
      cookie_sf: parseInt2(d['Cookie SF']),
      cookie_score: parseNumber(d['Cookie Score']),
      twitter_score: parseNumber(d['Twitter Score']),
      followers: parseInt2(d.Followers),
      avg_engagement: parseNumber(d['Avg Engagement']),
      avg_impressions: parseNumber(d['Avg Impressions']),
      engagement_rate: parseNumber(d['Engagement %']),
      image_url: d['Image URL'] || null,
      tg_link: d['TG Link'] || null,
      kaito_rank: kaitoMap.get(xHandle) || null,
      cookie_rank: cookieMap.get(xHandle) || null,
      ethos_rank: ethosMap.get(xHandle) || null,
      wallchain_rank: wallchainMap.get(xHandle) || null,
      galxe_rank: galxeMap.get(xHandle) || null,
    });
  }
  
  console.log(`   Found ${matched} profiles to insert (${skipped} skipped - no user match)`);
  
  // Insert in batches
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('infofi_profiles').insert(batch);
    
    if (error) {
      console.error(`   ❌ Error inserting batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
    
    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= records.length) {
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}...`);
    }
  }
  
  console.log(`   ✅ Inserted ${inserted} InfoFi profiles`);
}

// ============================================================================
// Main Migration
// ============================================================================

async function main() {
  console.log('🚀 Starting FULL InfoFi Migration (Scouting Mode)');
  console.log('==================================================\n');
  console.log('This will import ALL InfoFi users as prospects for scouting.\n');
  
  try {
    // Step 1: Clear existing data
    await clearAllTables();
    
    // Step 2: Migrate ALL users (Scout + InfoFi)
    await migrateAllUsers();
    
    // Step 3: Get user lookup for foreign keys
    const userLookup = await getUserLookup();
    
    // Step 4: Migrate Scout-specific tables
    await migrateDealTakers(userLookup);
    await migrateDormants(userLookup);
    await migrateNonInteractors(userLookup);
    
    // Step 5: Migrate ALL InfoFi profiles
    await migrateAllInfoFiProfiles(userLookup);
    
    // Print summary
    console.log('\n==================================================');
    console.log('✅ FULL Migration complete!');
    
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: scoutCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'scout');
    const { count: infofiCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'infofi');
    const { count: bothCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'both');
    const { count: prospectCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'prospect');
    const { count: dtCount } = await supabase.from('deal_takers').select('*', { count: 'exact', head: true });
    const { count: dormantCount } = await supabase.from('dormant_influencers').select('*', { count: 'exact', head: true });
    const { count: niCount } = await supabase.from('non_interactors').select('*', { count: 'exact', head: true });
    const { count: profileCount } = await supabase.from('infofi_profiles').select('*', { count: 'exact', head: true });
    
    console.log('\n📈 Final counts:');
    console.log(`   Total Users: ${userCount}`);
    console.log(`   ├─ Scout only: ${scoutCount}`);
    console.log(`   ├─ InfoFi only: ${infofiCount} (NEW PROSPECTS! 🎯)`);
    console.log(`   └─ Both sources: ${bothCount}`);
    console.log(`   `);
    console.log(`   Prospects to scout: ${prospectCount} 🔍`);
    console.log(`   Deal Takers: ${dtCount}`);
    console.log(`   Dormant Influencers: ${dormantCount}`);
    console.log(`   Non-Interactors: ${niCount}`);
    console.log(`   InfoFi Profiles: ${profileCount}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
