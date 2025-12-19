#!/usr/bin/env node
/**
 * Creator Profile Aggregation Script
 * Aggregates campaign_database.csv into creator profiles with drill-down data
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

// Normalize username for matching
function normalizeUsername(username) {
  return (username || '').toLowerCase().trim();
}

// Main aggregation function
function aggregateCreatorProfiles(campaignData, userDbData) {
  // Create user lookup map from yap_circle_user_db
  const userLookup = new Map();
  userDbData.forEach(user => {
    const xHandle = normalizeUsername(user['Username'] || user['username']);
    if (xHandle) {
      userLookup.set(xHandle, {
        telegramId: user['telegramId'] || '',
        telegramHandle: user['username'] || '',
        xLink: user['xLink'] || '',
        smartFollowers: parseFloat(user['Smart Followers']) || 0,
        status: user['status'] || '',
        submittedAt: user['submittedAt'] || ''
      });
    }
  });

  // Aggregate campaign data by creator
  const creatorMap = new Map();
  
  campaignData.forEach(row => {
    const username = row['username'] || '';
    const normalizedUsername = normalizeUsername(username);
    
    if (!normalizedUsername) return;
    
    // Get or create creator entry
    if (!creatorMap.has(normalizedUsername)) {
      const userInfo = userLookup.get(normalizedUsername) || {};
      creatorMap.set(normalizedUsername, {
        id: normalizedUsername,
        xHandle: username,
        telegramId: userInfo.telegramId || '',
        telegramHandle: userInfo.telegramHandle || '',
        xLink: userInfo.xLink || `https://x.com/${username}`,
        smartFollowers: userInfo.smartFollowers || 0,
        status: userInfo.status || 'unknown',
        
        // Aggregated stats (will be calculated)
        totalCampaigns: 0,
        totalPosts: 0,
        lifetimeEarnings: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalLikes: 0,
        totalReposts: 0,
        totalReplies: 0,
        avgCPM: 0,
        avgEngagementRate: 0,
        
        // Campaign details map (for aggregation)
        campaignMap: new Map()
      });
    }
    
    const creator = creatorMap.get(normalizedUsername);
    const campaignName = row['campaign_name'] || 'Unknown';
    
    // Get or create campaign entry
    if (!creator.campaignMap.has(campaignName)) {
      creator.campaignMap.set(campaignName, {
        campaignName: campaignName,
        posts: 0,
        budget: 0,
        impressions: 0,
        engagement: 0,
        likes: 0,
        reposts: 0,
        replies: 0,
        cpm: 0,
        engagementRate: 0,
        totalCpmWeight: 0,
        totalEngRateWeight: 0,
        months: []
      });
    }
    
    const campaign = creator.campaignMap.get(campaignName);
    
    // Parse row values
    const postCount = parseInt(row['post_count']) || 0;
    const budget = parseFloat(row['budget']) || 0;
    const impressions = parseInt(row['impressions']) || 0;
    const likes = parseInt(row['likes']) || 0;
    const reposts = parseInt(row['reposts']) || 0;
    const replies = parseInt(row['replies']) || 0;
    const totalEng = parseInt(row['total_eng']) || 0;
    const cpm = parseFloat(row['cpm']) || 0;
    const engRate = parseFloat(row['eng_rate']) || 0;
    const postMonth = row['post_month'] || '';
    
    // Add monthly data
    campaign.months.push({
      month: postMonth,
      posts: postCount,
      budget: budget,
      impressions: impressions,
      likes: likes,
      reposts: reposts,
      replies: replies,
      engagement: totalEng,
      cpm: cpm,
      engagementRate: engRate
    });
    
    // Aggregate campaign totals
    campaign.posts += postCount;
    // Budget is per campaign, not per month - take the first/max value
    if (campaign.budget === 0) {
      campaign.budget = budget;
    }
    campaign.impressions += impressions;
    campaign.likes += likes;
    campaign.reposts += reposts;
    campaign.replies += replies;
    campaign.engagement += totalEng;
    
    // Accumulate CPM values for weighted average calculation
    campaign.totalCpmWeight += impressions * cpm; // weighted by impressions
    campaign.totalEngRateWeight += impressions * engRate;
    
    // Aggregate creator totals
    creator.totalPosts += postCount;
    // Note: lifetimeEarnings will be recalculated from campaign budgets after deduplication
    creator.totalImpressions += impressions;
    creator.totalLikes += likes;
    creator.totalReposts += reposts;
    creator.totalReplies += replies;
    creator.totalEngagement += totalEng;
  });
  
  // Finalize calculations
  const profiles = [];
  
  creatorMap.forEach((creator, key) => {
    // Convert campaign map to array and calculate campaign-level metrics
    const campaigns = [];
    creator.campaignMap.forEach(campaign => {
      // Use weighted average of source CPM values (weighted by impressions)
      campaign.cpm = campaign.impressions > 0 
        ? campaign.totalCpmWeight / campaign.impressions 
        : 0;
      campaign.engagementRate = campaign.impressions > 0 
        ? campaign.totalEngRateWeight / campaign.impressions 
        : 0;
      
      // Clean up temporary fields
      delete campaign.totalCpmWeight;
      delete campaign.totalEngRateWeight;
      
      // Sort months chronologically
      campaign.months.sort((a, b) => a.month.localeCompare(b.month));
      
      campaigns.push(campaign);
    });
    
    // Sort campaigns by budget (highest first)
    campaigns.sort((a, b) => b.budget - a.budget);
    
    // Recalculate lifetime earnings from campaign budgets (now properly deduplicated)
    creator.lifetimeEarnings = campaigns.reduce((sum, c) => sum + c.budget, 0);
    
    // Calculate creator-level metrics using weighted average of campaign CPMs
    creator.totalCampaigns = campaigns.length;
    
    // Calculate weighted average CPM across all campaigns (weighted by impressions)
    const totalCpmWeight = campaigns.reduce((sum, c) => sum + (c.cpm * c.impressions), 0);
    creator.avgCPM = creator.totalImpressions > 0 
      ? totalCpmWeight / creator.totalImpressions 
      : 0;
    
    // Calculate weighted average engagement rate
    const totalEngWeight = campaigns.reduce((sum, c) => sum + (c.engagementRate * c.impressions), 0);
    creator.avgEngagementRate = creator.totalImpressions > 0 
      ? totalEngWeight / creator.totalImpressions 
      : 0;
    
    // Remove the temporary campaignMap and add campaigns array
    delete creator.campaignMap;
    creator.campaigns = campaigns;
    
    // Round numeric values
    creator.lifetimeEarnings = Math.round(creator.lifetimeEarnings * 100) / 100;
    creator.avgCPM = Math.round(creator.avgCPM * 100) / 100;
    creator.avgEngagementRate = Math.round(creator.avgEngagementRate * 100) / 100;
    
    campaigns.forEach(c => {
      c.budget = Math.round(c.budget * 100) / 100;
      c.cpm = Math.round(c.cpm * 100) / 100;
      c.engagementRate = Math.round(c.engagementRate * 100) / 100;
    });
    
    profiles.push(creator);
  });
  
  // Sort profiles by lifetime earnings (highest first)
  profiles.sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings);
  
  return profiles;
}

// Generate TypeScript file content
function generateTypeScript(profiles) {
  return `import { CreatorProfile } from "./types";

// Generated from campaign_database.csv (${profiles.length} creator profiles)
// Last updated: ${new Date().toISOString()}
export const CREATOR_PROFILES: CreatorProfile[] = ${JSON.stringify(profiles, null, 2)};

// Quick lookup map by normalized username
export const CREATOR_LOOKUP: Map<string, CreatorProfile> = new Map(
  CREATOR_PROFILES.map(p => [p.id, p])
);
`;
}

// Main execution
function main() {
  console.log('📊 Generating creator profiles from campaign data...\n');
  
  // Read CSV files
  const campaignCSV = fs.readFileSync(
    path.join(rootDir, 'DATABASE_creators', 'campaign_database.csv'), 
    'utf-8'
  );
  const userDbCSV = fs.readFileSync(
    path.join(rootDir, 'DATABASE_creators', 'yap_circle_user_db.csv'), 
    'utf-8'
  );
  
  // Parse CSVs
  const campaignData = parseCSV(campaignCSV);
  const userDbData = parseCSV(userDbCSV);
  
  console.log(`📁 Loaded ${campaignData.length} campaign records`);
  console.log(`📁 Loaded ${userDbData.length} user records`);
  
  // Aggregate profiles
  const profiles = aggregateCreatorProfiles(campaignData, userDbData);
  
  console.log(`\n✅ Generated ${profiles.length} creator profiles`);
  
  // Calculate totals for summary
  const totalCampaigns = profiles.reduce((sum, p) => sum + p.totalCampaigns, 0);
  const totalEarnings = profiles.reduce((sum, p) => sum + p.lifetimeEarnings, 0);
  const totalImpressions = profiles.reduce((sum, p) => sum + p.totalImpressions, 0);
  
  console.log(`   Total campaigns tracked: ${totalCampaigns}`);
  console.log(`   Total lifetime earnings: $${totalEarnings.toLocaleString()}`);
  console.log(`   Total impressions: ${totalImpressions.toLocaleString()}`);
  
  // Generate TypeScript
  const tsContent = generateTypeScript(profiles);
  
  // Write to creatorProfiles.ts
  const outputPath = path.join(rootDir, 'creatorProfiles.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  console.log(`\n🎉 Successfully generated ${outputPath}`);
  
  // Show top 5 creators
  console.log('\n📈 Top 5 Creators by Lifetime Earnings:');
  profiles.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. @${p.xHandle}: $${p.lifetimeEarnings.toLocaleString()} (${p.totalCampaigns} campaigns)`);
  });
}

main();
