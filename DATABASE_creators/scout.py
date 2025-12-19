import pandas as pd
import numpy as np

# 1. Load the Datasets
# Assuming the files are named as follows:
df_campaign = pd.read_csv('campaign_database.csv')
df_tg_members = pd.read_csv('yap_telegram_members.csv')
df_user_db = pd.read_csv('yap_circle_user_db.csv')

# --- DATA CLEANING & PREPARATION ---

# Normalize Campaign Data (X Handles)
# Convert to string, lowercase, strip whitespace for accurate matching
df_campaign['username_clean'] = df_campaign['username'].astype(str).str.lower().str.strip()

# Normalize User Database (The Bridge)
# We need to extract the X handle from the xLink or Username column to match the Campaign DB
# And ensure telegramId is the same format as the Telegram Members file
df_user_db['telegramId'] = pd.to_numeric(df_user_db['telegramId'], errors='coerce')
# Extract X handle from xLink (remove https://x.com/ etc)
df_user_db['x_handle_clean'] = df_user_db['xLink'].astype(str).str.split('/').str[-1].str.split('?').str[0].str.lower().str.strip()

# Normalize Telegram Members Data
df_tg_members['User ID'] = pd.to_numeric(df_tg_members['User ID'], errors='coerce')

# --- ANALYSIS 1: WHO TOOK DEALS? ---
# Logic: Unique names in Campaign DB
deal_takers = df_campaign.groupby('username_clean').agg({
    'budget': 'sum',
    'post_count': 'sum',
    'campaign_name': 'nunique' # Number of unique campaigns
}).reset_index()

deal_takers.columns = ['X_Handle', 'Total_Earnings', 'Total_Posts', 'Campaigns_Participated']
deal_takers = deal_takers.sort_values(by='Total_Earnings', ascending=False)

# --- ANALYSIS 2: WHO DIDN'T INTERACT WITH THE BOT? ---
# Logic: People in TG Members List whose User ID does NOT exist in User Database
# Left join TG members with User DB
merged_tg_bot = pd.merge(df_tg_members, df_user_db, left_on='User ID', right_on='telegramId', how='left')

# Filter for rows where telegramId from User DB is NaN (meaning no match found)
non_interactors = merged_tg_bot[merged_tg_bot['telegramId'].isna()]
non_interactors_list = non_interactors[['User ID', 'Username_x', 'First Name', 'Last Name', 'Join Date']]
non_interactors_list = non_interactors_list.rename(columns={'Username_x': 'TG_Username'})

# --- ANALYSIS 3: INFLUENCERS NOT TAKING DEALS ---
# Logic: Approved users in User DB who do NOT appear in Campaign DB
# Filter for approved users only first
approved_users = df_user_db[df_user_db['status'] == 'approved'].copy()

# Check if their X handle exists in the campaign list
dormant_influencers = approved_users[~approved_users['x_handle_clean'].isin(df_campaign['username_clean'])]

dormant_list = dormant_influencers[['telegramId', 'username', 'xLink', 'Smart Followers', 'submittedAt']]
dormant_list = dormant_list.rename(columns={'username': 'TG_Handle'})

# --- OUTPUT REPORT ---

print(f"--- SCOUT REPORT ---\n")

print(f"1. TOTAL DEAL TAKERS: {len(deal_takers)}")
print(f"   (Top 5 Earners):")
print(deal_takers.head(5).to_string(index=False))
print("\n" + "="*30 + "\n")

print(f"2. MEMBERS WHO IGNORED THE BOT: {len(non_interactors_list)}")
print(f"   (This represents {len(non_interactors_list)/len(df_tg_members)*100:.1f}% of your Telegram group)")
print(f"   Sample non-interactors:")
print(non_interactors_list[['TG_Username', 'First Name']].head(5).to_string(index=False))
print("\n" + "="*30 + "\n")

print(f"3. DORMANT INFLUENCERS (Approved but no deals): {len(dormant_list)}")
print(f"   Sample dormant profiles:")
print(dormant_list[['TG_Handle', 'xLink', 'Smart Followers']].head(5).to_string(index=False))

# --- EXPORT TO CSV FOR AGENCY USE ---
deal_takers.to_csv('Scout_1_Deal_Takers.csv', index=False)
non_interactors_list.to_csv('Scout_2_No_Bot_Interaction.csv', index=False)
dormant_list.to_csv('Scout_3_Dormant_Influencers.csv', index=False)