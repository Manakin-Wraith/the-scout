#!/usr/bin/env node
/**
 * InfoFi CSV to TypeScript Constants Generator
 * Parses InfoFi CSV files from Google Sheets export and generates infofiConstants.ts
 * 
 * Primary source: Details.csv (contains all key metrics)
 * Supplementary sources: Cookie, Kaito, Ethos, Wallchain, Galxe (for rankings)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// CSV Parser - handles quoted fields and commas within quotes
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// Parse boolean values from CSV
function parseBoolean(value) {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === 'yes' || lower === '1';
}

// Parse number with fallback
function parseNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

// Transform Details CSV to InfoFiProfile objects
function transformDetails(data) {
  return data.map(row => ({
    // Identity
    username: (row['username'] || '').toLowerCase(),
    name: row['name'] || '',
    
    // Location & Verification
    registered: row['Registered'] || '',
    location: row['Location'] || '',
    noVPN: parseBoolean(row['NO_VPN']),
    verified: parseBoolean(row['Verified']),
    
    // Risk Indicators
    usernameChanges: parseNumber(row['Username Changes'], 0),
    lastUsernameChange: row['Last Username Change'] || '',
    possibleBot: parseBoolean(row['Possibe Bot?']), // Note: typo in source CSV
    
    // Quality Scores
    ethosScore: parseNumber(row['Ethos Score'], 0),
    kaitoSF: parseNumber(row['Kaito SF'], 0),
    kaitoYaps: parseNumber(row['Kaito Yaps'], 0),
    cookieSF: parseNumber(row['Cookie SF'], 0),
    cookieScore: parseNumber(row['Cookie Score'], 0),
    twitterScore: parseNumber(row['Twitter Score'], 0),
    
    // Engagement Metrics
    followers: parseNumber(row['Followers'], 0),
    avgEngagement: parseNumber(row['Avg Engagement'], 0),
    avgImpressions: parseNumber(row['Avg Impressions'], 0),
    engagementRate: parseNumber(row['Engagement %'], 0),
    
    // Contact & Media
    tgLink: row['TG Link'] || '',
    imageUrl: row['Image URL'] || '',
    
    // Rankings (will be populated from supplementary files)
    kaitoRank: undefined,
    cookieRank: undefined,
    ethosRank: undefined,
    wallchainRank: undefined,
    galxeRank: undefined
  }));
}

// Extract rankings from supplementary CSV files
function extractRankings(data, source) {
  const rankings = new Map();
  
  data.forEach(row => {
    const username = (row['username'] || '').toLowerCase();
    const rank = parseNumber(row['rank'], null);
    
    if (username && rank !== null) {
      // Keep the best (lowest) rank for each user
      if (!rankings.has(username) || rank < rankings.get(username)) {
        rankings.set(username, rank);
      }
    }
  });
  
  return rankings;
}

// Merge rankings into profiles
function mergeRankings(profiles, kaitoRanks, cookieRanks, ethosRanks, wallchainRanks, galxeRanks) {
  return profiles.map(profile => ({
    ...profile,
    kaitoRank: kaitoRanks.get(profile.username),
    cookieRank: cookieRanks.get(profile.username),
    ethosRank: ethosRanks.get(profile.username),
    wallchainRank: wallchainRanks.get(profile.username),
    galxeRank: galxeRanks.get(profile.username)
  }));
}

// Generate TypeScript file content
function generateTypeScript(profiles) {
  return `import { InfoFiProfile } from "./types";

// Generated from InfoFi Google Sheets Export
// Primary source: All InfoFi Data - Serpin Data - Details.csv
// Supplementary sources: Cookie, Kaito, Ethos, Wallchain, Galxe CSVs
// Generated at: ${new Date().toISOString()}

export const INFOFI_DATA: InfoFiProfile[] = ${JSON.stringify(profiles, null, 2)};

// Quick lookup map by username (lowercase)
export const INFOFI_BY_USERNAME: Map<string, InfoFiProfile> = new Map(
  INFOFI_DATA.map(profile => [profile.username.toLowerCase(), profile])
);

// Statistics
export const INFOFI_STATS = {
  totalProfiles: ${profiles.length},
  withBotFlag: ${profiles.filter(p => p.possibleBot).length},
  withVPNFlag: ${profiles.filter(p => !p.noVPN).length},
  withUsernameChanges: ${profiles.filter(p => p.usernameChanges > 0).length},
  withEthosScore: ${profiles.filter(p => p.ethosScore > 0).length},
  withKaitoScore: ${profiles.filter(p => p.kaitoSF > 0).length},
  withCookieScore: ${profiles.filter(p => p.cookieScore > 0).length},
  withTelegramLink: ${profiles.filter(p => p.tgLink).length}
};
`;
}

// Read CSV file safely
function readCSVFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`📂 Reading ${description}...`);
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      console.log(`⚠️  ${description} not found at ${filePath}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error reading ${description}: ${error.message}`);
    return null;
  }
}

// Main execution
function main() {
  console.log('📊 Generating infofiConstants.ts from InfoFi CSV files...\n');
  
  // Define file paths (note: double space in filename from Google Sheets export)
  const detailsPath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Details.csv.csv');
  const cookiePath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Cookie.csv.csv');
  const kaitoPath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Kaito.csv.csv');
  const ethosPath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Ethos.csv.csv');
  const wallchainPath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Wallchain.csv.csv');
  const galxePath = path.join(rootDir, 'All InfoFi Data  - Serpin Data - Galxe.csv.csv');
  
  // Read primary source (Details.csv) - REQUIRED
  const detailsCSV = readCSVFile(detailsPath, 'Details.csv (primary)');
  if (!detailsCSV) {
    console.error('\n❌ Details.csv is required but not found. Aborting.');
    process.exit(1);
  }
  
  // Parse primary data
  const detailsData = parseCSV(detailsCSV);
  let profiles = transformDetails(detailsData);
  console.log(`✅ Details: ${profiles.length} profiles parsed`);
  
  // Read and parse supplementary files (optional)
  const cookieCSV = readCSVFile(cookiePath, 'Cookie.csv');
  const kaitoCSV = readCSVFile(kaitoPath, 'Kaito.csv');
  const ethosCSV = readCSVFile(ethosPath, 'Ethos.csv');
  const wallchainCSV = readCSVFile(wallchainPath, 'Wallchain.csv');
  const galxeCSV = readCSVFile(galxePath, 'Galxe.csv');
  
  // Extract rankings from supplementary files
  const cookieRanks = cookieCSV ? extractRankings(parseCSV(cookieCSV), 'cookie') : new Map();
  const kaitoRanks = kaitoCSV ? extractRankings(parseCSV(kaitoCSV), 'kaito') : new Map();
  const ethosRanks = ethosCSV ? extractRankings(parseCSV(ethosCSV), 'ethos') : new Map();
  const wallchainRanks = wallchainCSV ? extractRankings(parseCSV(wallchainCSV), 'wallchain') : new Map();
  const galxeRanks = galxeCSV ? extractRankings(parseCSV(galxeCSV), 'galxe') : new Map();
  
  console.log(`\n📈 Rankings extracted:`);
  console.log(`   Cookie: ${cookieRanks.size} users`);
  console.log(`   Kaito: ${kaitoRanks.size} users`);
  console.log(`   Ethos: ${ethosRanks.size} users`);
  console.log(`   Wallchain: ${wallchainRanks.size} users`);
  console.log(`   Galxe: ${galxeRanks.size} users`);
  
  // Merge rankings into profiles
  profiles = mergeRankings(profiles, kaitoRanks, cookieRanks, ethosRanks, wallchainRanks, galxeRanks);
  
  // Generate TypeScript
  const tsContent = generateTypeScript(profiles);
  
  // Write to infofiConstants.ts
  const outputPath = path.join(rootDir, 'infofiConstants.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  // Summary statistics
  const botsCount = profiles.filter(p => p.possibleBot).length;
  const vpnCount = profiles.filter(p => !p.noVPN).length;
  const changesCount = profiles.filter(p => p.usernameChanges > 0).length;
  
  console.log(`\n🎉 Successfully generated ${outputPath}`);
  console.log(`\n📊 Summary Statistics:`);
  console.log(`   Total profiles: ${profiles.length}`);
  console.log(`   🤖 Possible bots: ${botsCount} (${(botsCount/profiles.length*100).toFixed(1)}%)`);
  console.log(`   🔒 VPN detected: ${vpnCount} (${(vpnCount/profiles.length*100).toFixed(1)}%)`);
  console.log(`   📝 Username changes: ${changesCount} (${(changesCount/profiles.length*100).toFixed(1)}%)`);
}

main();
