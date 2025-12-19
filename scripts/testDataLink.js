#!/usr/bin/env node
/**
 * Test script to validate data linkage between InfoFi and existing datasets
 */

import { 
  getEnrichedDealTakers, 
  getEnrichedDormants, 
  getLinkageStats,
  getHighRiskDealTakers,
  getTopDormants,
  findReconnectionTargets
} from '../services/dataLinkService.ts';

console.log('🔗 Testing Data Linkage Service...\n');

// Get stats
const stats = getLinkageStats();

console.log('📊 Linkage Statistics:');
console.log('━'.repeat(50));

console.log('\n👥 Deal Takers:');
console.log(`   Total: ${stats.dealTakers.total}`);
console.log(`   With InfoFi data: ${stats.dealTakers.withInfoFi} (${(stats.dealTakers.withInfoFi / stats.dealTakers.total * 100).toFixed(1)}%)`);
console.log(`   🔴 Critical risk: ${stats.dealTakers.critical}`);
console.log(`   🟡 Warning risk: ${stats.dealTakers.warning}`);
console.log(`   🟢 Clean: ${stats.dealTakers.clean}`);

console.log('\n💎 Dormant Influencers:');
console.log(`   Total: ${stats.dormants.total}`);
console.log(`   With InfoFi data: ${stats.dormants.withInfoFi} (${(stats.dormants.withInfoFi / stats.dormants.total * 100).toFixed(1)}%)`);
console.log(`   Avg Quality Score: ${stats.dormants.avgQualityScore}`);
console.log(`   Top Quality (>70): ${stats.dormants.topQuality}`);

console.log('\n📱 Non-Interactors:');
console.log(`   Total: ${stats.nonInteractors.total}`);
console.log(`   Reconnectable: ${stats.nonInteractors.reconnectable}`);

// Sample high-risk deal takers
const highRisk = getHighRiskDealTakers();
if (highRisk.length > 0) {
  console.log('\n⚠️  Sample High-Risk Deal Takers:');
  highRisk.slice(0, 5).forEach(dt => {
    console.log(`   - @${dt.X_Handle} [${dt.riskLevel}]`);
    if (dt.infofi) {
      console.log(`     Bot: ${dt.infofi.possibleBot}, VPN: ${!dt.infofi.noVPN}, Changes: ${dt.infofi.usernameChanges}`);
    }
  });
}

// Sample top dormants
const topDormants = getTopDormants(5);
console.log('\n🌟 Top 5 Quality Dormant Influencers:');
topDormants.forEach((d, i) => {
  const handle = d.xLink.match(/x\.com\/([^?\/]+)/i)?.[1] || 'unknown';
  console.log(`   ${i + 1}. @${handle} - Score: ${d.qualityScore.toFixed(1)}, SF: ${d.Smart_Followers}`);
});

// Sample reconnection targets
const reconnectable = findReconnectionTargets();
if (reconnectable.length > 0) {
  console.log('\n🔄 Sample Reconnection Targets:');
  reconnectable.slice(0, 5).forEach(r => {
    console.log(`   - TG: @${r.TG_Username} → X: @${r.infofi.username}`);
  });
}

console.log('\n✅ Data linkage test complete!');
