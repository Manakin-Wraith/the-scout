/**
 * Migration Script: CSV to Supabase
 * 
 * This script migrates all CSV data to the Supabase database.
 * Run with: node scripts/migrateToSupabase.js
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
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx];
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

async function migrateUsers() {
  console.log('\n📦 Migrating users...');
  
  // Load all CSV data
  const dealTakers = loadCSV('Scout_1_Deal_Takers.csv');
  const nonInteractors = loadCSV('Scout_2_No_Bot_Interaction.csv');
  const dormants = loadCSV('Scout_3_Dormant_Influencers.csv');
  
  // Build unified user map (keyed by x_handle or telegram_id)
  const userMap = new Map();
  
  // Track seen x_handles and telegram_ids to avoid duplicates
  const seenXHandles = new Set();
  const seenTelegramIds = new Set();
  
  // Process Deal Takers (have X handles)
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
      });
    }
  }
  
  // Process Dormant Influencers (have telegram_id and xLink)
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
      // Create new user keyed by telegram
      seenTelegramIds.add(telegramId);
      if (xHandle) seenXHandles.add(xHandle);
      userMap.set(`tg:${telegramId}`, {
        x_handle: xHandle && !seenXHandles.has(xHandle) ? xHandle : null,
        x_link: d.xLink || null,
        telegram_id: telegramId,
        telegram_handle: d.TG_Handle || null,
        first_name: null,
        last_name: null,
      });
    }
  }
  
  // Process Non-Interactors (have telegram info only)
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
      });
    }
  }
  
  // Insert users in batches
  const users = Array.from(userMap.values());
  console.log(`   Found ${users.length} unique users`);
  
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('users').insert(batch).select('id, x_handle, telegram_id');
    
    if (error) {
      console.error(`   ❌ Error inserting users batch ${i}:`, error.message);
    } else {
      inserted += data.length;
    }
  }
  
  console.log(`   ✅ Inserted ${inserted} users`);
  return inserted;
}

async function getUserLookup() {
  // Fetch all users for lookup
  const { data: users, error } = await supabase.from('users').select('id, x_handle, telegram_id');
  if (error) {
    console.error('Failed to fetch users:', error.message);
    return { byXHandle: new Map(), byTelegramId: new Map() };
  }
  
  const byXHandle = new Map();
  const byTelegramId = new Map();
  
  for (const user of users) {
    if (user.x_handle) byXHandle.set(user.x_handle, user.id);
    if (user.telegram_id) byTelegramId.set(user.telegram_id, user.id);
  }
  
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
  
  const { data, error } = await supabase.from('deal_takers').insert(records);
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
  
  const { data, error } = await supabase.from('dormant_influencers').insert(records);
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
  
  const { data, error } = await supabase.from('non_interactors').insert(records);
  if (error) {
    console.error('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Inserted ${records.length} non-interactors`);
  }
}

async function migrateInfoFi(userLookup) {
  console.log('\n🔍 Migrating InfoFi profiles...');
  
  // Load main details file
  const details = loadCSV('All InfoFi Data  - Serpin Data - Details.csv.csv');
  
  // Load ranking files for supplementary data
  const kaitoRanks = loadCSV('All InfoFi Data  - Serpin Data - Kaito.csv.csv');
  const cookieRanks = loadCSV('All InfoFi Data  - Serpin Data - Cookie.csv.csv');
  const ethosRanks = loadCSV('All InfoFi Data  - Serpin Data - Ethos.csv.csv');
  const wallchainRanks = loadCSV('All InfoFi Data  - Serpin Data - Wallchain.csv.csv');
  const galxeRanks = loadCSV('All InfoFi Data  - Serpin Data - Galxe.csv.csv');
  
  // Build rank lookup maps
  const kaitoMap = new Map(kaitoRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const cookieMap = new Map(cookieRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const ethosMap = new Map(ethosRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const wallchainMap = new Map(wallchainRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  const galxeMap = new Map(galxeRanks.map(r => [normalizeHandle(r.username), parseInt2(r.rank)]));
  
  const records = [];
  let matched = 0;
  
  for (const d of details) {
    const xHandle = normalizeHandle(d.username);
    const userId = userLookup.byXHandle.get(xHandle);
    
    if (userId) {
      matched++;
      records.push({
        user_id: userId,
        registered: d.Registered || null,
        location: d.Location || null,
        no_vpn: parseBoolean(d.NO_VPN),
        verified: parseBoolean(d.Verified),
        username_changes: parseInt2(d['Username Changes']) || 0,
        last_username_change: parseDate(d['Last Username Change']),
        possible_bot: parseBoolean(d['Possibe Bot?']),
        ethos_score: parseNumber(d['Ethos Score']),
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
  }
  
  console.log(`   Found ${matched} InfoFi profiles matching existing users`);
  
  // Insert in batches
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('infofi_profiles').insert(batch);
    
    if (error) {
      console.error(`   ❌ Error inserting InfoFi batch ${i}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }
  
  console.log(`   ✅ Inserted ${inserted} InfoFi profiles`);
}

// ============================================================================
// Main Migration
// ============================================================================

async function main() {
  console.log('🚀 Starting Supabase Migration');
  console.log('================================\n');
  
  try {
    // Step 1: Clear existing data
    await clearAllTables();
    
    // Step 2: Migrate users (creates unified identity)
    await migrateUsers();
    
    // Step 3: Get user lookup for foreign keys
    const userLookup = await getUserLookup();
    console.log(`\n📊 User lookup ready: ${userLookup.byXHandle.size} by X handle, ${userLookup.byTelegramId.size} by Telegram ID`);
    
    // Step 4: Migrate related tables
    await migrateDealTakers(userLookup);
    await migrateDormants(userLookup);
    await migrateNonInteractors(userLookup);
    await migrateInfoFi(userLookup);
    
    console.log('\n================================');
    console.log('✅ Migration complete!');
    
    // Print summary
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: dtCount } = await supabase.from('deal_takers').select('*', { count: 'exact', head: true });
    const { count: dormantCount } = await supabase.from('dormant_influencers').select('*', { count: 'exact', head: true });
    const { count: niCount } = await supabase.from('non_interactors').select('*', { count: 'exact', head: true });
    const { count: infofiCount } = await supabase.from('infofi_profiles').select('*', { count: 'exact', head: true });
    
    console.log('\n📈 Final counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Deal Takers: ${dtCount}`);
    console.log(`   Dormant Influencers: ${dormantCount}`);
    console.log(`   Non-Interactors: ${niCount}`);
    console.log(`   InfoFi Profiles: ${infofiCount}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
