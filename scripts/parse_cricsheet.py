#!/usr/bin/env python3
"""
CricMystic - Canonical Cricsheet IPL Data Parser (2008 - 2026)
Parses all Cricsheet match files, normalizes franchise identities, and compiles
strict mathematical cricket aggregates without placeholders or fabricated records.
"""

import os
import json
import glob
from collections import defaultdict
from typing import Dict, List, Any, Optional

CANONICAL_TEAMS = {
    "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
    "Royal Challengers Bengaluru": "Royal Challengers Bengaluru",
    "Delhi Daredevils": "Delhi Capitals",
    "Delhi Capitals": "Delhi Capitals",
    "Kings XI Punjab": "Punjab Kings",
    "Punjab Kings": "Punjab Kings",
    "Rising Pune Supergiant": "Rising Pune Supergiant",
    "Rising Pune Supergiants": "Rising Pune Supergiant",
    "Deccan Chargers": "Deccan Chargers",
    "Sunrisers Hyderabad": "Sunrisers Hyderabad",
    "Mumbai Indians": "Mumbai Indians",
    "Chennai Super Kings": "Chennai Super Kings",
    "Kolkata Knight Riders": "Kolkata Knight Riders",
    "Rajasthan Royals": "Rajasthan Royals",
    "Gujarat Titans": "Gujarat Titans",
    "Lucknow Super Giants": "Lucknow Super Giants",
    "Gujarat Lions": "Gujarat Lions",
    "Pune Warriors": "Pune Warriors",
    "Kochi Tuskers Kerala": "Kochi Tuskers Kerala"
}

def get_canonical_team(name: str) -> str:
    if not name:
        return ""
    clean = name.strip()
    return CANONICAL_TEAMS.get(clean, clean)

def parse_season_str(season_raw: Any, date_str: str = "") -> int:
    # Match dates in IPL always reflect the actual calendar year season
    if date_str and len(date_str) >= 4:
        try:
            return int(date_str[:4])
        except Exception:
            pass
    s_str = str(season_raw).strip()
    if s_str in ["2007/08", "2008"]:
        return 2008
    elif s_str in ["2009/10", "2010"]:
        return 2010
    elif s_str in ["2020/21", "2020"]:
        return 2020
    elif "/" in s_str:
        parts = s_str.split("/")
        if len(parts) > 1 and len(parts[1]) == 2:
            return int(parts[0][:2] + parts[1])
        return int(parts[0])
    try:
        return int(s_str)
    except Exception:
        return 2008

class CricsheetParser:
    def __init__(self, raw_dir: str = "data/raw/cricsheet"):
        self.raw_dir = raw_dir
        self.matches = []
        self.ml_states = []
        self.season_stats = defaultdict(lambda: {
            "season": 0, "matches": 0, "runs": 0, "sixes": 0, "fours": 0,
            "wickets": 0, "deliveries": 0, "champion": "", "runnerUp": "",
            "finalMatchId": "", "finalVenue": "", "finalMargin": "",
            "highestScore": {"runs": 0, "team": "", "opponent": "", "matchId": "", "date": ""},
            "lowestScore": {"runs": 9999, "team": "", "opponent": "", "matchId": "", "date": ""},
            "highestChase": {"target": 0, "runs": 0, "team": "", "opponent": "", "matchId": "", "date": ""}
        })
        self.team_stats = defaultdict(lambda: {
            "matches": 0, "wins": 0, "losses": 0, "noResults": 0, "titles": 0,
            "titleYears": [], "finals": 0, "years": set()
        })
        self.venue_stats = defaultdict(lambda: {
            "matches": 0, "chasingWins": 0, "batFirstWins": 0, "city": "",
            "total1stInnRuns": 0, "inn1Matches": 0
        })
        self.h2h_stats = defaultdict(lambda: defaultdict(lambda: {
            "matches": 0, "team1Wins": 0, "team2Wins": 0, "noResults": 0
        }))
        self.batter_stats = defaultdict(lambda: {
            "name": "", "runs": 0, "balls": 0, "fours": 0, "sixes": 0,
            "outs": 0, "fifties": 0, "hundreds": 0, "highestScore": 0,
            "innings": set(), "matches": set()
        })
        self.bowler_stats = defaultdict(lambda: {
            "name": "", "wickets": 0, "runsConceded": 0, "legalBalls": 0, "dotBalls": 0,
            "innings": set(), "fourWickets": 0, "fiveWickets": 0, "bestWickets": 0, "bestRuns": 999,
            "matches": set()
        })
        self.audit_report = {}

    def load_and_parse_all(self):
        json_files = glob.glob(os.path.join(self.raw_dir, "*.json"))
        json_files = [f for f in json_files if not os.path.basename(f).startswith("README")]
        
        print(f"[*] Found {len(json_files):,} raw JSON files in {self.raw_dir}")
        if len(json_files) == 0:
            raise FileNotFoundError(f"No Cricsheet JSON files found in {self.raw_dir}")

        parsed_matches = []
        for idx, fpath in enumerate(sorted(json_files)):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                match_id = os.path.basename(fpath).replace(".json", "")
                parsed = self.parse_single_match(match_id, data)
                if parsed:
                    parsed_matches.append(parsed)
            except Exception as e:
                print(f"[!] Error parsing {fpath}: {e}")

        # Sort matches chronologically by date and match_id
        parsed_matches.sort(key=lambda m: (m["date"], m["match_id"]))
        self.matches = parsed_matches
        print(f"[+] Successfully parsed {len(self.matches):,} valid IPL matches.")

        # Post-process historical aggregates & ML states
        self.build_historical_and_ml_datasets()
        self.build_audit_report()

    def parse_single_match(self, match_id: str, data: dict):
        info = data.get("info", {})
        if not info:
            return None

        dates = info.get("dates", [])
        date_str = dates[0] if dates else "2008-01-01"
        season_raw = info.get("season", 2008)
        season = parse_season_str(season_raw, date_str)

        venue = info.get("venue", "Unknown Venue")
        city = info.get("city") or venue.split(",")[0] or "Unknown"

        teams = info.get("teams", [])
        if len(teams) < 2:
            return None

        team1_raw = teams[0]
        team2_raw = teams[1]
        team1 = get_canonical_team(team1_raw)
        team2 = get_canonical_team(team2_raw)

        toss = info.get("toss", {})
        toss_winner_raw = toss.get("winner", "")
        toss_winner = get_canonical_team(toss_winner_raw)
        toss_decision = toss.get("decision", "bat")

        outcome = info.get("outcome", {})
        winner_raw = outcome.get("winner", "")
        winner = get_canonical_team(winner_raw)
        result_type = outcome.get("result", "")
        margin_dict = outcome.get("by", {})

        margin_runs = margin_dict.get("runs")
        margin_wickets = margin_dict.get("wickets")
        if margin_runs is not None:
            margin_str = f"{margin_runs} runs"
        elif margin_wickets is not None:
            margin_str = f"{margin_wickets} wickets"
        elif "eliminator" in outcome or "super_over" in outcome:
            margin_str = "Super Over"
            result_type = "tie"
        elif result_type:
            margin_str = result_type
        else:
            margin_str = "No result"

        player_of_match = info.get("player_of_match", [""])[0] if info.get("player_of_match") else ""
        event = info.get("event", {})
        stage = event.get("stage") or ""
        match_number = str(event.get("match_number", ""))

        # Parse innings and deliveries
        innings_raw = data.get("innings", [])
        parsed_innings = []

        total_runs_inn1 = 0
        total_wickets_inn1 = 0
        total_overs_inn1 = 0

        target_runs = 0
        if len(innings_raw) > 1:
            inn2_info = innings_raw[1]
            if "target" in inn2_info and "runs" in inn2_info["target"]:
                target_runs = inn2_info["target"]["runs"]

        for inn_idx, inn in enumerate(innings_raw):
            inn_team_raw = inn.get("team", "")
            inn_team = get_canonical_team(inn_team_raw)
            inn_num = inn_idx + 1

            bowling_team = team2 if inn_team == team1 else team1

            deliveries = []
            score = 0
            wickets = 0
            legal_balls = 0

            # Match level batter/bowler innings accumulator
            innings_batters = defaultdict(lambda: {"runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": False})
            innings_bowlers = defaultdict(lambda: {"legal_balls": 0, "runs": 0, "wickets": 0, "dots": 0})

            overs_data = inn.get("overs", [])
            for over_obj in overs_data:
                over_num = over_obj.get("over", 0)
                for ball_obj in over_obj.get("deliveries", []):
                    batter = ball_obj.get("batter", "")
                    bowler = ball_obj.get("bowler", "")
                    non_striker = ball_obj.get("non_striker", "")
                    runs_info = ball_obj.get("runs", {})
                    batter_runs = runs_info.get("batter", 0)
                    extra_runs = runs_info.get("extras", 0)
                    total_delivery_runs = runs_info.get("total", 0)

                    extras_info = ball_obj.get("extras", {})
                    wides = extras_info.get("wides", 0)
                    noballs = extras_info.get("noballs", 0)
                    byes = extras_info.get("byes", 0)
                    legbyes = extras_info.get("legbyes", 0)

                    is_legal = (wides == 0 and noballs == 0)
                    if is_legal:
                        legal_balls += 1

                    score += total_delivery_runs

                    # Wicket detection
                    wickets_info = ball_obj.get("wickets", [])
                    is_wicket = len(wickets_info) > 0
                    dismissal_kind = ""
                    player_out = ""
                    if is_wicket:
                        w_obj = wickets_info[0]
                        dismissal_kind = w_obj.get("kind", "")
                        player_out = w_obj.get("player_out", batter)
                        if dismissal_kind != "retired hurt":
                            wickets += 1

                    completed_overs = (legal_balls - (1 if is_legal else 0)) // 6
                    ball_in_over = (legal_balls - (1 if is_legal else 0)) % 6 + (1 if is_legal else 0)
                    over_display = f"{completed_overs}.{ball_in_over}"

                    # Update player stats
                    innings_batters[batter]["runs"] += batter_runs
                    if is_legal or noballs > 0:
                        innings_batters[batter]["balls"] += 1
                    if batter_runs == 4:
                        innings_batters[batter]["fours"] += 1
                    elif batter_runs == 6:
                        innings_batters[batter]["sixes"] += 1

                    if is_wicket and player_out:
                        innings_batters[player_out]["out"] = True

                    if is_legal:
                        innings_bowlers[bowler]["legal_balls"] += 1
                        if total_delivery_runs == 0:
                            innings_bowlers[bowler]["dots"] += 1

                    bowler_conceded = batter_runs + wides + noballs
                    innings_bowlers[bowler]["runs"] += bowler_conceded
                    if is_wicket and dismissal_kind not in ["run out", "retired hurt", "obstructing the field"]:
                        innings_bowlers[bowler]["wickets"] += 1

                    deliveries.append({
                        "innings": inn_num,
                        "over": completed_overs,
                        "ball": ball_in_over,
                        "overDisplay": over_display,
                        "legalBallNumber": legal_balls,
                        "isLegal": is_legal,
                        "battingTeam": inn_team,
                        "bowlingTeam": bowling_team,
                        "batter": batter,
                        "bowler": bowler,
                        "nonStriker": non_striker,
                        "batterRuns": batter_runs,
                        "extraRuns": extra_runs,
                        "totalRuns": total_delivery_runs,
                        "wides": wides,
                        "noballs": noballs,
                        "byes": byes,
                        "legbyes": legbyes,
                        "isWicket": is_wicket,
                        "dismissalKind": dismissal_kind,
                        "playerOut": player_out,
                        "score": score,
                        "wickets": wickets
                    })

            if inn_num == 1:
                total_runs_inn1 = score
                total_wickets_inn1 = wickets
                total_overs_inn1 = legal_balls / 6
                if target_runs == 0:
                    target_runs = score + 1

            parsed_innings.append({
                "innings": inn_num,
                "team": inn_team,
                "bowlingTeam": bowling_team,
                "score": score,
                "wickets": wickets,
                "legalBalls": legal_balls,
                "overs": f"{legal_balls // 6}.{legal_balls % 6}",
                "deliveries": deliveries,
                "batters": innings_batters,
                "bowlers": innings_bowlers
            })

        return {
            "match_id": match_id,
            "season": season,
            "date": date_str,
            "venue": venue,
            "city": city,
            "team1": team1,
            "team2": team2,
            "team1_raw": team1_raw,
            "team2_raw": team2_raw,
            "toss_winner": toss_winner,
            "toss_decision": toss_decision,
            "winner": winner,
            "result_type": result_type,
            "margin": margin_str,
            "player_of_match": player_of_match,
            "stage": stage,
            "match_number": match_number,
            "target": target_runs,
            "first_innings_score": total_runs_inn1,
            "first_innings_wickets": total_wickets_inn1,
            "innings": parsed_innings
        }

    def build_historical_and_ml_datasets(self):
        print("[*] Generating ML state representations and compiling historical aggregations...")

        # Group matches by season to identify true Finals accurately
        season_matches = defaultdict(list)
        for m in self.matches:
            season_matches[m["season"]].append(m)

        finals_by_season = {}
        for s, m_list in season_matches.items():
            sorted_m = sorted(m_list, key=lambda x: (x["date"], x["match_id"]))
            # Match strictly with stage == 'Final' (ignoring Semi Final / Qualifier) or last match
            exact_finals = [m for m in sorted_m if str(m["stage"]).strip().lower() == "final" or str(m["match_number"]).strip().lower() == "final"]
            if exact_finals:
                finals_by_season[s] = exact_finals[-1]
            else:
                finals_by_season[s] = sorted_m[-1]

        # Rolling pre-match win rate tracker to prevent future leakage
        pre_match_team_records = defaultdict(lambda: {"matches": 0, "wins": 0})
        pre_match_venue_records = defaultdict(lambda: {"matches": 0, "chasingWins": 0})

        ml_dataset = []

        for match in self.matches:
            season = match["season"]
            m_id = match["match_id"]
            team1 = match["team1"]
            team2 = match["team2"]
            winner = match["winner"]
            venue = match["venue"]
            date = match["date"]
            target = match["target"]
            innings_list = match["innings"]

            # Track teams & seasons
            self.season_stats[season]["season"] = season
            self.season_stats[season]["matches"] += 1
            self.team_stats[team1]["matches"] += 1
            self.team_stats[team1]["years"].add(season)
            self.team_stats[team2]["matches"] += 1
            self.team_stats[team2]["years"].add(season)

            self.h2h_stats[team1][team2]["matches"] += 1
            self.h2h_stats[team2][team1]["matches"] += 1

            if winner == team1:
                self.team_stats[team1]["wins"] += 1
                self.team_stats[team2]["losses"] += 1
                self.h2h_stats[team1][team2]["team1Wins"] += 1
                self.h2h_stats[team2][team1]["team2Wins"] += 1
            elif winner == team2:
                self.team_stats[team2]["wins"] += 1
                self.team_stats[team1]["losses"] += 1
                self.h2h_stats[team1][team2]["team2Wins"] += 1
                self.h2h_stats[team2][team1]["team1Wins"] += 1
            else:
                self.team_stats[team1]["noResults"] += 1
                self.team_stats[team2]["noResults"] += 1
                self.h2h_stats[team1][team2]["noResults"] += 1
                self.h2h_stats[team2][team1]["noResults"] += 1

            self.venue_stats[venue]["matches"] += 1
            self.venue_stats[venue]["city"] = match["city"]

            # Season records accumulation
            for inn in innings_list:
                team_inn = inn["team"]
                opp_team = inn["bowlingTeam"]
                inn_score = inn["score"]
                inn_wkts = inn["wickets"]
                inn_balls = inn["legalBalls"]

                self.season_stats[season]["runs"] += inn_score
                self.season_stats[season]["wickets"] += inn_wkts
                self.season_stats[season]["deliveries"] += len(inn["deliveries"])

                for d in inn["deliveries"]:
                    if d["batterRuns"] == 6:
                        self.season_stats[season]["sixes"] += 1
                    elif d["batterRuns"] == 4:
                        self.season_stats[season]["fours"] += 1

                # Highest innings total
                if inn_score > self.season_stats[season]["highestScore"]["runs"]:
                    self.season_stats[season]["highestScore"] = {
                        "runs": inn_score,
                        "wickets": inn_wkts,
                        "team": team_inn,
                        "opponent": opp_team,
                        "matchId": m_id,
                        "date": date
                    }

                # Lowest completed innings (>= 15 overs or all out)
                if (inn_balls >= 90 or inn_wkts == 10) and inn_score < self.season_stats[season]["lowestScore"]["runs"]:
                    self.season_stats[season]["lowestScore"] = {
                        "runs": inn_score,
                        "wickets": inn_wkts,
                        "team": team_inn,
                        "opponent": opp_team,
                        "matchId": m_id,
                        "date": date
                    }

                # Highest successful chase
                if inn["innings"] == 2 and winner == team_inn and inn_score > self.season_stats[season]["highestChase"]["runs"]:
                    self.season_stats[season]["highestChase"] = {
                        "target": target,
                        "runs": inn_score,
                        "wickets": inn_wkts,
                        "team": team_inn,
                        "opponent": opp_team,
                        "matchId": m_id,
                        "date": date
                    }

            # Check if this match is the grand final of the season
            final_match = finals_by_season.get(season)
            if final_match and final_match["match_id"] == m_id and winner:
                runner_up = team2 if winner == team1 else team1
                self.season_stats[season]["champion"] = winner
                self.season_stats[season]["runnerUp"] = runner_up
                self.season_stats[season]["finalMatchId"] = m_id
                self.season_stats[season]["finalVenue"] = venue
                self.season_stats[season]["finalMargin"] = match["margin"]
                self.team_stats[winner]["titles"] += 1
                self.team_stats[winner]["titleYears"].append(season)
                self.team_stats[winner]["finals"] += 1
                self.team_stats[runner_up]["finals"] += 1

            # Accumulate player stats
            for inn in innings_list:
                for b_name, b_info in inn["batters"].items():
                    r = b_info["runs"]
                    self.batter_stats[b_name]["name"] = b_name
                    self.batter_stats[b_name]["runs"] += r
                    self.batter_stats[b_name]["balls"] += b_info["balls"]
                    self.batter_stats[b_name]["fours"] += b_info["fours"]
                    self.batter_stats[b_name]["sixes"] += b_info["sixes"]
                    self.batter_stats[b_name]["innings"].add(f"{m_id}_{inn['innings']}")
                    self.batter_stats[b_name]["matches"].add(m_id)
                    if b_info["out"]:
                        self.batter_stats[b_name]["outs"] += 1
                    if r >= 100:
                        self.batter_stats[b_name]["hundreds"] += 1
                    elif r >= 50:
                        self.batter_stats[b_name]["fifties"] += 1
                    if r > self.batter_stats[b_name]["highestScore"]:
                        self.batter_stats[b_name]["highestScore"] = r

                for w_name, w_info in inn["bowlers"].items():
                    w = w_info["wickets"]
                    r_c = w_info["runs"]
                    self.bowler_stats[w_name]["name"] = w_name
                    self.bowler_stats[w_name]["wickets"] += w
                    self.bowler_stats[w_name]["runsConceded"] += r_c
                    self.bowler_stats[w_name]["legalBalls"] += w_info["legal_balls"]
                    self.bowler_stats[w_name]["dotBalls"] += w_info["dots"]
                    self.bowler_stats[w_name]["innings"].add(f"{m_id}_{inn['innings']}")
                    self.bowler_stats[w_name]["matches"].add(m_id)
                    if w >= 5:
                        self.bowler_stats[w_name]["fiveWickets"] += 1
                    elif w == 4:
                        self.bowler_stats[w_name]["fourWickets"] += 1
                    if w > self.bowler_stats[w_name]["bestWickets"] or (w == self.bowler_stats[w_name]["bestWickets"] and r_c < self.bowler_stats[w_name]["bestRuns"]):
                        self.bowler_stats[w_name]["bestWickets"] = w
                        self.bowler_stats[w_name]["bestRuns"] = r_c

            # Process chasing innings (Innings 2) for ML states
            if len(innings_list) >= 2:
                inn1 = innings_list[0]
                inn2 = innings_list[1]
                chasing_team = inn2["team"]
                defending_team = inn1["team"]
                
                self.venue_stats[venue]["inn1Matches"] += 1
                self.venue_stats[venue]["total1stInnRuns"] += inn1["score"]

                if winner == chasing_team:
                    self.venue_stats[venue]["chasingWins"] += 1
                    target_label = 1
                elif winner == defending_team:
                    self.venue_stats[venue]["batFirstWins"] += 1
                    target_label = 0
                else:
                    target_label = None

                bat_prior = pre_match_team_records[chasing_team]
                bat_winrate = (bat_prior["wins"] / bat_prior["matches"]) if bat_prior["matches"] >= 5 else 0.50
                bowl_prior = pre_match_team_records[defending_team]
                bowl_winrate = (bowl_prior["wins"] / bowl_prior["matches"]) if bowl_prior["matches"] >= 5 else 0.50

                venue_prior = pre_match_venue_records[venue]
                venue_chasing_rate = (venue_prior["chasingWins"] / venue_prior["matches"]) if venue_prior["matches"] >= 5 else 0.52

                toss_winner_batting = 1 if match["toss_winner"] == chasing_team else 0

                deliveries = inn2["deliveries"]
                recent_runs_history = []
                recent_wickets_history = []
                recent_dots_history = []
                recent_boundaries_history = []

                for d_idx, d in enumerate(deliveries):
                    legal_balls_bowled = d["legalBallNumber"]
                    balls_remaining = max(0, 120 - legal_balls_bowled)
                    current_score = d["score"]
                    wickets_lost = d["wickets"]
                    wickets_remaining = max(0, 10 - wickets_lost)
                    runs_required = max(0, target - current_score)

                    crr = (current_score / (legal_balls_bowled / 6)) if legal_balls_bowled > 0 else 0
                    rrr = (runs_required / (balls_remaining / 6)) if balls_remaining > 0 else (99.0 if runs_required > 0 else 0.0)
                    rrr_crr_diff = rrr - crr
                    chase_progress = (current_score / target) if target > 0 else 0

                    last_6_runs = sum(recent_runs_history[-6:]) if len(recent_runs_history) > 0 else int(crr)
                    last_12_runs = sum(recent_runs_history[-12:]) if len(recent_runs_history) > 0 else int(crr * 2)
                    last_18_runs = sum(recent_runs_history[-18:]) if len(recent_runs_history) > 0 else int(crr * 3)
                    last_12_wickets = sum(recent_wickets_history[-12:]) if len(recent_wickets_history) > 0 else 0

                    dots_in_window = sum(recent_dots_history[-12:]) if len(recent_dots_history) > 0 else 0
                    window_len = min(12, len(recent_dots_history))
                    dot_ball_ratio = (dots_in_window / window_len) if window_len > 0 else 0.35

                    bounds_in_window = sum(recent_boundaries_history[-12:]) if len(recent_boundaries_history) > 0 else 0
                    boundary_ratio = (bounds_in_window / window_len) if window_len > 0 else 0.18

                    is_powerplay = 1 if legal_balls_bowled <= 36 else 0
                    is_death_overs = 1 if legal_balls_bowled >= 96 else 0

                    state_dict = {
                        "match_id": m_id,
                        "season": season,
                        "innings": 2,
                        "delivery_index": d_idx,
                        "over_display": d["overDisplay"],
                        "legal_balls_bowled": legal_balls_bowled,
                        "balls_remaining": balls_remaining,
                        "runs_required": runs_required,
                        "current_score": current_score,
                        "target": target,
                        "wickets_remaining": wickets_remaining,
                        "wickets_lost": wickets_lost,
                        "current_rr": round(crr, 3),
                        "required_rr": round(min(36.0, rrr), 3),
                        "rrr_crr_diff": round(max(-20.0, min(30.0, rrr_crr_diff)), 3),
                        "chase_progress": round(chase_progress, 4),
                        "last_6_runs": last_6_runs,
                        "last_12_runs": last_12_runs,
                        "last_18_runs": last_18_runs,
                        "last_12_wickets": last_12_wickets,
                        "dot_ball_ratio": round(dot_ball_ratio, 3),
                        "boundary_ratio": round(boundary_ratio, 3),
                        "is_powerplay": is_powerplay,
                        "is_death_overs": is_death_overs,
                        "team_batting_winrate": round(bat_winrate, 3),
                        "team_bowling_winrate": round(bowl_winrate, 3),
                        "venue_chasing_winrate": round(venue_chasing_rate, 3),
                        "toss_winner_batting": toss_winner_batting,
                        "won": target_label
                    }

                    if target_label is not None:
                        ml_dataset.append(state_dict)

                    recent_runs_history.append(d["totalRuns"])
                    recent_wickets_history.append(1 if d["isWicket"] else 0)
                    recent_dots_history.append(1 if d["totalRuns"] == 0 else 0)
                    recent_boundaries_history.append(1 if d["batterRuns"] in [4, 6] else 0)

            # Update rolling pre-match win rates after match ends
            if winner == team1:
                pre_match_team_records[team1]["matches"] += 1
                pre_match_team_records[team1]["wins"] += 1
                pre_match_team_records[team2]["matches"] += 1
            elif winner == team2:
                pre_match_team_records[team2]["matches"] += 1
                pre_match_team_records[team2]["wins"] += 1
                pre_match_team_records[team1]["matches"] += 1

            if len(innings_list) >= 2 and winner:
                chasing = innings_list[1]["team"]
                pre_match_venue_records[venue]["matches"] += 1
                if winner == chasing:
                    pre_match_venue_records[venue]["chasingWins"] += 1

        self.ml_states = ml_dataset
        print(f"[+] Compiled {len(self.ml_states):,} delivery state instances for ML.")

    def build_audit_report(self):
        seasons_found = sorted(list(self.season_stats.keys()))
        total_deliveries = sum(
            sum(len(inn["deliveries"]) for inn in m["innings"])
            for m in self.matches
        )

        matches_2026 = [m for m in self.matches if m["season"] == 2026]
        final_2026 = self.season_stats[2026]

        self.audit_report = {
            "source": "Cricsheet",
            "source_url": "https://cricsheet.org/downloads/ipl_json.zip",
            "first_season": min(seasons_found) if seasons_found else 2008,
            "latest_season": max(seasons_found) if seasons_found else 2026,
            "total_seasons": len(seasons_found),
            "seasons_list": seasons_found,
            "total_matches": len(self.matches),
            "total_deliveries": total_deliveries,
            "total_teams": len(self.team_stats),
            "total_venues": len(self.venue_stats),
            "total_players": len(self.batter_stats),
            "matches_2026_count": len(matches_2026),
            "final_2026_found": bool(final_2026["champion"]),
            "winner_2026": final_2026["champion"],
            "runner_up_2026": final_2026["runnerUp"],
            "final_2026_margin": final_2026["finalMargin"],
            "final_2026_match_id": final_2026["finalMatchId"],
            "data_quality_status": "PASS" if len(self.matches) >= 1000 and total_deliveries >= 200000 else "FAIL"
        }

if __name__ == "__main__":
    parser = CricsheetParser()
    parser.load_and_parse_all()
    print("Audit Report Summary:", json.dumps(parser.audit_report, indent=2))
