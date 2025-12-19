export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaign_participation: {
        Row: {
          budget: number | null
          campaign_id: string | null
          cpm: number | null
          engagement: number | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          month: string | null
          posts: number | null
          replies: number | null
          reposts: number | null
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          campaign_id?: string | null
          cpm?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          month?: string | null
          posts?: number | null
          replies?: number | null
          reposts?: number | null
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          campaign_id?: string | null
          cpm?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          month?: string | null
          posts?: number | null
          replies?: number | null
          reposts?: number | null
          user_id?: string | null
        }
      }
      campaigns: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          total_budget: number | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          total_budget?: number | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          total_budget?: number | null
        }
      }
      deal_takers: {
        Row: {
          campaigns_participated: number | null
          created_at: string | null
          id: string
          total_earnings: number | null
          total_posts: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          campaigns_participated?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          total_posts?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          campaigns_participated?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          total_posts?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      dormant_influencers: {
        Row: {
          created_at: string | null
          id: string
          smart_followers: number | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          smart_followers?: number | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          smart_followers?: number | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
      }
      infofi_profiles: {
        Row: {
          avg_engagement: number | null
          avg_impressions: number | null
          cookie_rank: number | null
          cookie_score: number | null
          cookie_sf: number | null
          created_at: string | null
          engagement_rate: number | null
          ethos_rank: number | null
          ethos_score: number | null
          followers: number | null
          galxe_rank: number | null
          id: string
          image_url: string | null
          kaito_rank: number | null
          kaito_sf: number | null
          kaito_yaps: number | null
          last_username_change: string | null
          location: string | null
          no_vpn: boolean | null
          possible_bot: boolean | null
          registered: string | null
          tg_link: string | null
          twitter_score: number | null
          updated_at: string | null
          user_id: string | null
          username_changes: number | null
          verified: boolean | null
          wallchain_rank: number | null
        }
        Insert: {
          avg_engagement?: number | null
          avg_impressions?: number | null
          cookie_rank?: number | null
          cookie_score?: number | null
          cookie_sf?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          ethos_rank?: number | null
          ethos_score?: number | null
          followers?: number | null
          galxe_rank?: number | null
          id?: string
          image_url?: string | null
          kaito_rank?: number | null
          kaito_sf?: number | null
          kaito_yaps?: number | null
          last_username_change?: string | null
          location?: string | null
          no_vpn?: boolean | null
          possible_bot?: boolean | null
          registered?: string | null
          tg_link?: string | null
          twitter_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          username_changes?: number | null
          verified?: boolean | null
          wallchain_rank?: number | null
        }
        Update: {
          avg_engagement?: number | null
          avg_impressions?: number | null
          cookie_rank?: number | null
          cookie_score?: number | null
          cookie_sf?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          ethos_rank?: number | null
          ethos_score?: number | null
          followers?: number | null
          galxe_rank?: number | null
          id?: string
          image_url?: string | null
          kaito_rank?: number | null
          kaito_sf?: number | null
          kaito_yaps?: number | null
          last_username_change?: string | null
          location?: string | null
          no_vpn?: boolean | null
          possible_bot?: boolean | null
          registered?: string | null
          tg_link?: string | null
          twitter_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          username_changes?: number | null
          verified?: boolean | null
          wallchain_rank?: number | null
        }
      }
      non_interactors: {
        Row: {
          created_at: string | null
          id: string
          join_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          join_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          join_date?: string | null
          user_id?: string | null
        }
      }
      shortlist_items: {
        Row: {
          added_at: string | null
          id: string
          item_type: string
          notes: string | null
          shortlist_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          item_type: string
          notes?: string | null
          shortlist_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          item_type?: string
          notes?: string | null
          shortlist_id?: string | null
          user_id?: string | null
        }
      }
      shortlists: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          telegram_handle: string | null
          telegram_id: string | null
          updated_at: string | null
          x_handle: string | null
          x_link: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          telegram_handle?: string | null
          telegram_id?: string | null
          updated_at?: string | null
          x_handle?: string | null
          x_link?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          telegram_handle?: string | null
          telegram_id?: string | null
          updated_at?: string | null
          x_handle?: string | null
          x_link?: string | null
        }
      }
    }
    Views: {
      enriched_deal_takers: {
        Row: {
          campaigns_participated: number | null
          cookie_score: number | null
          engagement_rate: number | null
          ethos_score: number | null
          followers: number | null
          id: string | null
          image_url: string | null
          kaito_sf: number | null
          location: string | null
          no_vpn: boolean | null
          possible_bot: boolean | null
          risk_level: string | null
          telegram_handle: string | null
          telegram_id: string | null
          tg_link: string | null
          total_earnings: number | null
          total_posts: number | null
          username_changes: number | null
          verified: boolean | null
          x_handle: string | null
          x_link: string | null
        }
      }
      enriched_dormants: {
        Row: {
          cookie_score: number | null
          engagement_rate: number | null
          ethos_score: number | null
          followers: number | null
          id: string | null
          image_url: string | null
          kaito_sf: number | null
          location: string | null
          no_vpn: boolean | null
          possible_bot: boolean | null
          quality_score: number | null
          smart_followers: number | null
          status: string | null
          submitted_at: string | null
          telegram_handle: string | null
          telegram_id: string | null
          tg_link: string | null
          verified: boolean | null
          x_handle: string | null
          x_link: string | null
        }
      }
      whale_candidates: {
        Row: {
          cookie_score: number | null
          engagement_rate: number | null
          ethos_score: number | null
          followers: number | null
          id: string | null
          image_url: string | null
          kaito_sf: number | null
          location: string | null
          no_vpn: boolean | null
          possible_bot: boolean | null
          quality_score: number | null
          smart_followers: number | null
          status: string | null
          submitted_at: string | null
          telegram_handle: string | null
          telegram_id: string | null
          tg_link: string | null
          verified: boolean | null
          x_handle: string | null
          x_link: string | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
