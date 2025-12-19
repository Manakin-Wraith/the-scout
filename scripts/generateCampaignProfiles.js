#!/usr/bin/env node
/**
 * Campaign Profile Aggregation Script
 * Aggregates campaign_database.csv into campaign profiles with drill-down data
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

// Normalize campaign name for ID
function normalizeCampaignName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Main aggregation function
function aggregateCampaignProfiles(campaignData) {
  const campaignMap = new Map();
  
  campaignData.forEach(row => {
    const campaignName = row['campaign_name'] || '';
    const normalizedName = normalizeCampaignName(campaignName);
    
    if (!normalizedName) return;
    
    // Get or create campaign entry
    if (!campaignMap.has(normalizedName)) {
      campaignMap.set(normalizedName, {
        id: normalizedName,
        campaignName: campaignName,
        startMonth: '',
        endMonth: '',
        durationMonths: 0,
        
        // Aggregated stats
        totalCreators: 0,
        totalPosts: 0,
        totalBudget: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalLikes: 0,
        totalReposts: 0,
        totalReplies: 0,
        avgCPM: 0,
        avgEngagementRate: 0,
        
        // Performance metrics
        budgetPerCreator: 0,
        impressionsPerPost: 0,
        engagementPerPost: 0,
        
        // For aggregation
        creatorMap: new Map(),
        monthSet: new Set(),
        totalCpmWeight: 0,
        totalEngRateWeight: 0
      });
    }
    
    const campaign = campaignMap.get(normalizedName);
    const username = row['username'] || '';
    const postMonth = row['post_month'] || '';
    
    // Track months
    if (postMonth) {
      campaign.monthSet.add(postMonth);
    }
    
    // Get or create creator entry within campaign
    if (!campaign.creatorMap.has(username.toLowerCase())) {
      campaign.creatorMap.set(username.toLowerCase(), {
        username: username,
        xLink: `https://x.com/${username}`,
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
    
    const creator = campaign.creatorMap.get(username.toLowerCase());
    
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
    
    // Add monthly data to creator
    creator.months.push({
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
    
    // Aggregate creator totals
    creator.posts += postCount;
    // Budget is per campaign/creator, not per month - take the first/max value
    if (creator.budget === 0) {
      creator.budget = budget;
    }
    creator.impressions += impressions;
    creator.likes += likes;
    creator.reposts += reposts;
    creator.replies += replies;
    creator.engagement += totalEng;
    creator.totalCpmWeight += impressions * cpm;
    creator.totalEngRateWeight += impressions * engRate;
    
    // Aggregate campaign totals (budget will be recalculated from creator budgets later)
    campaign.totalPosts += postCount;
    campaign.totalImpressions += impressions;
    campaign.totalLikes += likes;
    campaign.totalReposts += reposts;
    campaign.totalReplies += replies;
    campaign.totalEngagement += totalEng;
    campaign.totalCpmWeight += impressions * cpm;
    campaign.totalEngRateWeight += impressions * engRate;
  });
  
  // Finalize calculations
  const profiles = [];
  
  campaignMap.forEach((campaign, key) => {
    // Convert creator map to array
    const creators = [];
    campaign.creatorMap.forEach(creator => {
      // Calculate creator-level metrics using weighted average
      creator.cpm = creator.impressions > 0 
        ? creator.totalCpmWeight / creator.impressions 
        : 0;
      creator.engagementRate = creator.impressions > 0 
        ? creator.totalEngRateWeight / creator.impressions 
        : 0;
      
      // Clean up temp fields
      delete creator.totalCpmWeight;
      delete creator.totalEngRateWeight;
      
      // Sort months chronologically
      creator.months.sort((a, b) => a.month.localeCompare(b.month));
      
      // Round values
      creator.budget = Math.round(creator.budget * 100) / 100;
      creator.cpm = Math.round(creator.cpm * 100) / 100;
      creator.engagementRate = Math.round(creator.engagementRate * 100) / 100;
      
      creators.push(creator);
    });
    
    // Sort creators by budget (highest first)
    creators.sort((a, b) => b.budget - a.budget);
    
    // Recalculate total budget from creator budgets (now properly deduplicated)
    campaign.totalBudget = creators.reduce((sum, c) => sum + c.budget, 0);
    
    // Calculate campaign-level metrics
    campaign.totalCreators = creators.length;
    campaign.avgCPM = campaign.totalImpressions > 0 
      ? campaign.totalCpmWeight / campaign.totalImpressions 
      : 0;
    campaign.avgEngagementRate = campaign.totalImpressions > 0 
      ? campaign.totalEngRateWeight / campaign.totalImpressions 
      : 0;
    
    // Calculate performance metrics
    campaign.budgetPerCreator = campaign.totalCreators > 0 
      ? campaign.totalBudget / campaign.totalCreators 
      : 0;
    campaign.impressionsPerPost = campaign.totalPosts > 0 
      ? campaign.totalImpressions / campaign.totalPosts 
      : 0;
    campaign.engagementPerPost = campaign.totalPosts > 0 
      ? campaign.totalEngagement / campaign.totalPosts 
      : 0;
    
    // Calculate duration
    const months = Array.from(campaign.monthSet).sort();
    campaign.startMonth = months[0] || '';
    campaign.endMonth = months[months.length - 1] || '';
    campaign.durationMonths = months.length;
    
    // Generate monthly breakdown
    const monthlyMap = new Map();
    creators.forEach(creator => {
      creator.months.forEach(m => {
        if (!monthlyMap.has(m.month)) {
          monthlyMap.set(m.month, {
            month: m.month,
            creators: new Set(),
            posts: 0,
            budget: 0,
            impressions: 0,
            engagement: 0,
            totalCpmWeight: 0,
            totalEngRateWeight: 0
          });
        }
        const monthly = monthlyMap.get(m.month);
        monthly.creators.add(creator.username.toLowerCase());
        monthly.posts += m.posts;
        monthly.budget += m.budget;
        monthly.impressions += m.impressions;
        monthly.engagement += m.engagement;
        monthly.totalCpmWeight += m.impressions * m.cpm;
        monthly.totalEngRateWeight += m.impressions * m.engagementRate;
      });
    });
    
    const monthlyBreakdown = Array.from(monthlyMap.values())
      .map(m => ({
        month: m.month,
        creators: m.creators.size,
        posts: m.posts,
        budget: Math.round(m.budget * 100) / 100,
        impressions: m.impressions,
        engagement: m.engagement,
        cpm: m.impressions > 0 ? Math.round((m.totalCpmWeight / m.impressions) * 100) / 100 : 0,
        engagementRate: m.impressions > 0 ? Math.round((m.totalEngRateWeight / m.impressions) * 100) / 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Clean up temp fields
    delete campaign.creatorMap;
    delete campaign.monthSet;
    delete campaign.totalCpmWeight;
    delete campaign.totalEngRateWeight;
    
    // Add final data
    campaign.creators = creators;
    campaign.monthlyBreakdown = monthlyBreakdown;
    
    // Round values
    campaign.totalBudget = Math.round(campaign.totalBudget * 100) / 100;
    campaign.avgCPM = Math.round(campaign.avgCPM * 100) / 100;
    campaign.avgEngagementRate = Math.round(campaign.avgEngagementRate * 100) / 100;
    campaign.budgetPerCreator = Math.round(campaign.budgetPerCreator * 100) / 100;
    campaign.impressionsPerPost = Math.round(campaign.impressionsPerPost);
    campaign.engagementPerPost = Math.round(campaign.engagementPerPost);
    
    profiles.push(campaign);
  });
  
  // Sort profiles by total budget (highest first)
  profiles.sort((a, b) => b.totalBudget - a.totalBudget);
  
  return profiles;
}

// Generate TypeScript file content
function generateTypeScript(profiles) {
  return `import { CampaignProfile } from "./types";

// Generated from campaign_database.csv (${profiles.length} campaign profiles)
// Last updated: ${new Date().toISOString()}
export const CAMPAIGN_PROFILES: CampaignProfile[] = ${JSON.stringify(profiles, null, 2)};

// Quick lookup map by normalized campaign name
export const CAMPAIGN_LOOKUP: Map<string, CampaignProfile> = new Map(
  CAMPAIGN_PROFILES.map(p => [p.id, p])
);
`;
}

// Main execution
function main() {
  console.log('📊 Generating campaign profiles from campaign data...\n');
  
  // Read CSV file
  const campaignCSV = fs.readFileSync(
    path.join(rootDir, 'DATABASE_creators', 'campaign_database.csv'), 
    'utf-8'
  );
  
  // Parse CSV
  const campaignData = parseCSV(campaignCSV);
  
  console.log(`📁 Loaded ${campaignData.length} campaign records`);
  
  // Aggregate profiles
  const profiles = aggregateCampaignProfiles(campaignData);
  
  console.log(`\n✅ Generated ${profiles.length} campaign profiles`);
  
  // Calculate totals for summary
  const totalCreators = new Set(profiles.flatMap(p => p.creators.map(c => c.username.toLowerCase()))).size;
  const totalBudget = profiles.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalImpressions = profiles.reduce((sum, p) => sum + p.totalImpressions, 0);
  
  console.log(`   Total unique creators: ${totalCreators}`);
  console.log(`   Total budget: $${totalBudget.toLocaleString()}`);
  console.log(`   Total impressions: ${totalImpressions.toLocaleString()}`);
  
  // Generate TypeScript
  const tsContent = generateTypeScript(profiles);
  
  // Write to campaignProfiles.ts
  const outputPath = path.join(rootDir, 'campaignProfiles.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  console.log(`\n🎉 Successfully generated ${outputPath}`);
  
  // Show top 5 campaigns
  console.log('\n📈 Top 5 Campaigns by Budget:');
  profiles.slice(0, 5).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.campaignName}: $${p.totalBudget.toLocaleString()} (${p.totalCreators} creators, ${p.totalPosts} posts)`);
  });
}

main();
