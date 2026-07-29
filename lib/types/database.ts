export type Position = 'TANK' | 'DAMAGE' | 'HEALER';
export type UserRole = 'USER' | 'ADMIN';

export interface Season {
  id: number;
  name: string;
  logo_url?: string;
  start_date?: string;
  end_date?: string;
}

export interface Team {
  id: number;
  name: string;
  emblem_url?: string;
}

export interface Streamer {
  id: number;
  name: string;
  nickname?: string;
  profile_image_url?: string;
  chzzk_channel_url?: string;
  youtube_channel_url?: string;
}

export interface Match {
  id: number;
  season_id: number;
  tournament_stage: string;
  match_date?: string;
  team_a_id: number;
  team_b_id: number;
  winner_team_id?: number;
}

export interface MatchSet {
  id: number;
  match_id: number;
  set_number: number;
  map_id: number;
  winner_team_id: number;
  game_duration_seconds?: number;
  vod_url?: string;
}

export interface PlayerSetStat {
  id: number;
  match_set_id: number;
  streamer_id: number;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  healing: number;
  mitigated_damage: number;
  main_hero_ids?: string[];
  is_mvp: boolean;
}
