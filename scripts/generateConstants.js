#!/usr/bin/env node
/**
 * CSV to TypeScript Constants Generator
 * Parses CSV files and generates constants.ts with full dataset
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

// Transform Deal Takers CSV to TypeScript
function transformDealTakers(data) {
  return data.map(row => ({
    X_Handle: row['X_Handle'] || '',
    Total_Earnings: parseFloat(row['Total_Earnings']) || 0,
    Total_Posts: parseInt(row['Total_Posts']) || 0,
    Campaigns_Participated: parseInt(row['Campaigns_Participated']) || 0
  }));
}

// Transform Non-Interactors CSV to TypeScript
function transformNonInteractors(data) {
  return data.map(row => ({
    User_ID: row['User ID'] || '',
    TG_Username: row['TG_Username'] || '',
    First_Name: row['First Name'] || '',
    Last_Name: row['Last Name'] || '',
    Join_Date: row['Join Date']?.split(' ')[0] || '' // Extract date part only
  }));
}

// Transform Dormant Influencers CSV to TypeScript
function transformDormantInfluencers(data) {
  return data.map(row => ({
    telegramId: row['telegramId'] || '',
    TG_Handle: row['TG_Handle'] || '',
    xLink: row['xLink'] || '',
    Smart_Followers: parseFloat(row['Smart Followers']) || 0,
    submittedAt: row['submittedAt']?.split('T')[0] || '' // Extract date part only
  }));
}

// Generate TypeScript file content
function generateTypeScript(dealTakers, nonInteractors, dormantInfluencers) {
  return `import { DealTaker, DormantInfluencer, NonInteractor } from "./types";

// Generated from Scout_1_Deal_Takers.csv (${dealTakers.length} records)
export const DEAL_TAKERS: DealTaker[] = ${JSON.stringify(dealTakers, null, 2)};

// Generated from Scout_2_No_Bot_Interaction.csv (${nonInteractors.length} records)
export const NON_INTERACTORS: NonInteractor[] = ${JSON.stringify(nonInteractors, null, 2)};

// Generated from Scout_3_Dormant_Influencers.csv (${dormantInfluencers.length} records)
export const DORMANT_INFLUENCERS: DormantInfluencer[] = ${JSON.stringify(dormantInfluencers, null, 2)};
`;
}

// Main execution
function main() {
  console.log('📊 Generating constants.ts from CSV files...\n');
  
  // Read CSV files
  const dealTakersCSV = fs.readFileSync(path.join(rootDir, 'Scout_1_Deal_Takers.csv'), 'utf-8');
  const nonInteractorsCSV = fs.readFileSync(path.join(rootDir, 'Scout_2_No_Bot_Interaction.csv'), 'utf-8');
  const dormantCSV = fs.readFileSync(path.join(rootDir, 'Scout_3_Dormant_Influencers.csv'), 'utf-8');
  
  // Parse and transform
  const dealTakers = transformDealTakers(parseCSV(dealTakersCSV));
  const nonInteractors = transformNonInteractors(parseCSV(nonInteractorsCSV));
  const dormantInfluencers = transformDormantInfluencers(parseCSV(dormantCSV));
  
  console.log(`✅ Deal Takers: ${dealTakers.length} records`);
  console.log(`✅ Non-Interactors: ${nonInteractors.length} records`);
  console.log(`✅ Dormant Influencers: ${dormantInfluencers.length} records`);
  
  // Generate TypeScript
  const tsContent = generateTypeScript(dealTakers, nonInteractors, dormantInfluencers);
  
  // Write to constants.ts
  const outputPath = path.join(rootDir, 'constants.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  console.log(`\n🎉 Successfully generated ${outputPath}`);
  console.log(`   Total records: ${dealTakers.length + nonInteractors.length + dormantInfluencers.length}`);
}

main();
