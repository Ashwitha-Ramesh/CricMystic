import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'data', 'processed');
const RAW_DIR = path.join(process.cwd(), 'data', 'raw', 'cricsheet');

function safeLoadJson(filename: string, fallback: any = {}): any {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`[!] Warning: could not load ${filename}:`, err);
  }
  return fallback;
}

// Load datasets in memory for microsecond response times
const iplSummary = safeLoadJson('ipl_summary.json', { totalMatches: 1243, totalDeliveries: 295732 });
const modelArtifacts = safeLoadJson('model_artifacts.json', { model_type: 'Calibrated Logistic Regression', featureKeys: [] });
const matchesIndex: any[] = safeLoadJson('matches_index.json', []);
const teamsData = safeLoadJson('teams_data.json', {});
const teamMetadata = safeLoadJson('team_metadata.json', {});
const venuesData = safeLoadJson('venues_data.json', {});
const seasonsData = safeLoadJson('seasons_data.json', []);
const playersData = safeLoadJson('players_data.json', { topBatters: [], topBowlers: [] });
const turningPoints = safeLoadJson('turning_points.json', {});
const mysticMoments = safeLoadJson('mystic_moments.json', []);
const didYouKnow = safeLoadJson('did_you_know.json', []);
const analystChallenges = safeLoadJson('analyst_challenges.json', []);
const mysticChallenges = safeLoadJson('mystic_challenges.json', []);

// Prediction helper function
function computeWinProbability(params: {
  battingTeam: string;
  bowlingTeam: string;
  venue: string;
  innings: number;
  currentScore: number;
  wicketsLost: number;
  overs: number; // e.g. 15.2
  target: number;
  tossWinner?: string;
  tossDecision?: string;
  last6Runs?: number;
  last12Runs?: number;
  last18Runs?: number;
  last12Wickets?: number;
  dotRatio?: number;
  boundaryRatio?: number;
}) {
  const overNum = Math.floor(params.overs);
  const ballsInOver = Math.round((params.overs - overNum) * 10);
  const legalBallsBowled = Math.min(120, overNum * 6 + ballsInOver);
  const ballsRemaining = Math.max(0, 120 - legalBallsBowled);
  const target = params.target || (params.innings === 1 ? 175 : params.currentScore + 1);
  const runsRequired = Math.max(0, target - params.currentScore);
  const wicketsRemaining = Math.max(0, 10 - params.wicketsLost);

  const crr = legalBallsBowled > 0 ? (params.currentScore / (legalBallsBowled / 6)) : 0;
  const rrr = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)) : (runsRequired > 0 ? 99 : 0);
  const rrrCrrDiff = rrr - crr;
  const chaseProgress = target > 0 ? (params.currentScore / target) : 0;

  // Historical team stats
  const batTeamStats = teamsData[params.battingTeam] || { wins: 10, matches: 20 };
  const bowlTeamStats = teamsData[params.bowlingTeam] || { wins: 10, matches: 20 };
  const batWinRate = batTeamStats.matches > 0 ? batTeamStats.wins / batTeamStats.matches : 0.5;
  const bowlWinRate = bowlTeamStats.matches > 0 ? bowlTeamStats.wins / bowlTeamStats.matches : 0.5;

  const venueStat = venuesData[params.venue] || { matches: 20, chasingWins: 10 };
  const venueChasingWinRate = venueStat.matches > 0 ? venueStat.chasingWins / venueStat.matches : 0.52;

  const tossWinnerBatting = params.tossWinner ? (params.tossWinner === params.battingTeam ? 1 : 0) : 1;

  // Features map
  const stateObj: Record<string, number> = {
    balls_remaining: ballsRemaining,
    runs_required: runsRequired,
    wickets_remaining: wicketsRemaining,
    current_rr: crr,
    required_rr: Math.min(36, rrr),
    rrr_crr_diff: Math.max(-20, Math.min(30, rrrCrrDiff)),
    chase_progress: chaseProgress,
    last_6_runs: params.last6Runs ?? Math.min(18, Math.round(crr)),
    last_12_runs: params.last12Runs ?? Math.min(36, Math.round(crr * 2)),
    last_18_runs: params.last18Runs ?? Math.min(54, Math.round(crr * 3)),
    last_12_wickets: params.last12Wickets ?? 0,
    dot_ball_ratio: params.dotRatio ?? (legalBallsBowled > 0 ? 0.35 : 0.35),
    boundary_ratio: params.boundaryRatio ?? (legalBallsBowled > 0 ? 0.18 : 0.18),
    is_powerplay: legalBallsBowled <= 36 ? 1 : 0,
    is_death_overs: legalBallsBowled >= 96 ? 1 : 0,
    team_batting_winrate: batWinRate,
    team_bowling_winrate: bowlWinRate,
    venue_chasing_winrate: venueChasingWinRate,
    toss_winner_batting: tossWinnerBatting
  };

  const featureKeys: string[] = modelArtifacts.featureKeys || [];
  const featureMeans: Record<string, number> = modelArtifacts.means || modelArtifacts.featureMeans || {};
  const featureStds: Record<string, number> = modelArtifacts.stds || modelArtifacts.featureStds || {};
  const weights: number[] = modelArtifacts.weights || [];
  const bias: number = modelArtifacts.bias || 0;

  let z = bias;
  const factorContributions: { feature: string; label: string; contribution: number; impact: 'favours_batting' | 'favours_bowling'; explanation: string }[] = [];

  for (let j = 0; j < featureKeys.length; j++) {
    const k = featureKeys[j];
    const val = stateObj[k] ?? 0;
    const norm = (val - (featureMeans[k] || 0)) / (featureStds[k] || 1);
    const contrib = weights[j] * norm;
    z += contrib;

    // Feature natural explanation
    let expl = '';
    if (k === 'required_rr') {
      expl = rrr > 12 
        ? `Stiff required run rate of ${rrr.toFixed(2)} RPO exerts extreme scoreboard pressure.`
        : `Comfortable required run rate of ${rrr.toFixed(2)} RPO allows batting side to pace the innings.`;
    } else if (k === 'wickets_remaining') {
      expl = wicketsRemaining >= 6 
        ? `${wicketsRemaining} wickets in hand provides depth for boundary hitting.` 
        : `Only ${wicketsRemaining} wickets in hand increases collapse vulnerability.`;
    } else if (k === 'current_rr') {
      expl = `Healthy current run rate of ${crr.toFixed(2)} RPO sustains momentum.`;
    } else if (k === 'chase_progress') {
      expl = `Completed ${(chaseProgress * 100).toFixed(0)}% of the target (${params.currentScore}/${target}).`;
    } else if (k === 'runs_required') {
      expl = `${runsRequired} runs required from ${ballsRemaining} balls.`;
    } else if (k === 'rrr_crr_diff') {
      expl = rrrCrrDiff > 3 
        ? `Required rate exceeds current rate by ${rrrCrrDiff.toFixed(2)} RPO.` 
        : `Current run rate is keeping pace with the required target trajectory.`;
    } else if (k === 'last_12_wickets') {
      expl = params.last12Wickets && params.last12Wickets > 0 
        ? `${params.last12Wickets} wicket(s) lost in recent overs caused a stutter.` 
        : `No wickets lost in recent overs preserves batting partnership.`;
    } else if (k === 'venue_chasing_winrate') {
      expl = `${params.venue || 'Venue'} historical chasing win rate stands at ${(venueChasingWinRate * 100).toFixed(1)}%.`;
    } else if (k === 'team_batting_winrate') {
      expl = `${params.battingTeam} historical match win rate is ${(batWinRate * 100).toFixed(1)}%.`;
    } else if (k === 'team_bowling_winrate') {
      expl = `${params.bowlingTeam} historical win defence rate is ${(bowlWinRate * 100).toFixed(1)}%.`;
    } else if (k === 'balls_remaining') {
      expl = `${ballsRemaining} legal deliveries left in the innings.`;
    } else if (k === 'dot_ball_ratio') {
      expl = `Dot ball pressure at ${((stateObj.dot_ball_ratio || 0) * 100).toFixed(0)}% of balls bowled.`;
    } else if (k === 'boundary_ratio') {
      expl = `Boundary frequency at ${((stateObj.boundary_ratio || 0) * 100).toFixed(0)}% of deliveries.`;
    } else if (k === 'is_death_overs') {
      expl = 'Death overs phase (16-20) elevates per-ball variance.';
    } else if (k === 'is_powerplay') {
      expl = 'Powerplay field restrictions active (Overs 1-6).';
    } else if (k === 'toss_winner_batting') {
      expl = tossWinnerBatting === 1 ? 'Batting side won the toss and dictated match conditions.' : 'Defending side chose bowling advantage.';
    } else {
      expl = `${formatFeatureLabel(k)} impact (+${contrib.toFixed(2)})`;
    }

    factorContributions.push({
      feature: k,
      label: formatFeatureLabel(k),
      contribution: contrib,
      impact: contrib > 0 ? 'favours_batting' : 'favours_bowling',
      explanation: expl
    });
  }

  // Pure terminal conditions
  let rawProb = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));

  if (params.currentScore >= target && target > 0) {
    rawProb = 1.0;
  } else if (params.wicketsLost >= 10 || (ballsRemaining === 0 && params.currentScore < target && target > 0)) {
    rawProb = 0.0;
  }

  const battingProb = Math.min(99.5, Math.max(0.5, Math.round(rawProb * 1000) / 10));
  const bowlingProb = Math.round((100 - battingProb) * 10) / 10;

  // Categorize Mystic Meter
  let meterState: 'Very unlikely' | 'Against the odds' | 'Too close to call' | 'Favourites' | 'Strongly favoured' = 'Too close to call';
  let meterDescription = 'The contest is hanging on a knife-edge.';

  if (battingProb < 20) {
    meterState = 'Very unlikely';
    meterDescription = `${params.bowlingTeam} firmly commanding the match; steep uphill task for ${params.battingTeam}.`;
  } else if (battingProb < 40) {
    meterState = 'Against the odds';
    meterDescription = `${params.bowlingTeam} holds the tactical advantage, but a boundary burst could shift momentum.`;
  } else if (battingProb <= 60) {
    meterState = 'Too close to call';
    meterDescription = 'Deadlock contest where a single over or key wicket can determine the victor.';
  } else if (battingProb <= 80) {
    meterState = 'Favourites';
    meterDescription = `${params.battingTeam} in strong position with clear path to victory.`;
  } else {
    meterState = 'Strongly favoured';
    meterDescription = `${params.battingTeam} overwhelmingly favoured based on match situation.`;
  }

  // Top reasons
  const sortedPositive = factorContributions.filter(f => f.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const sortedNegative = factorContributions.filter(f => f.contribution < 0).sort((a, b) => a.contribution - b.contribution);

  const whyBattingFavoured = sortedPositive.slice(0, 3).map(f => f.explanation);
  const whyBowlingCanTurn = sortedNegative.slice(0, 3).map(f => f.explanation);

  return {
    battingTeam: params.battingTeam,
    bowlingTeam: params.bowlingTeam,
    battingProbability: battingProb,
    bowlingProbability: bowlingProb,
    meterState,
    meterDescription,
    calculatedMetrics: {
      ballsRemaining,
      runsRequired,
      currentRunRate: Math.round(crr * 100) / 100,
      requiredRunRate: Math.round(rrr * 100) / 100,
      rrrCrrDifference: Math.round(rrrCrrDiff * 100) / 100,
      wicketsRemaining,
      chaseProgressPercent: Math.round(chaseProgress * 1000) / 10
    },
    whyBattingFavoured: whyBattingFavoured.length > 0 ? whyBattingFavoured : ['Strong foundation and high balls in hand relative to target.'],
    whyBowlingCanTurn: whyBowlingCanTurn.length > 0 ? whyBowlingCanTurn : ['Quick wickets or back-to-back dot ball sequences can choke the run flow.'],
    contributions: factorContributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  };
}

function formatFeatureLabel(feat: string): string {
  const map: Record<string, string> = {
    required_rr: 'Required Run Rate (RRR)',
    rrr_crr_diff: 'Run Rate Deficit (RRR - CRR)',
    wickets_remaining: 'Wickets in Hand',
    chase_progress: 'Chase Target Completion %',
    runs_required: 'Runs Needed to Win',
    balls_remaining: 'Balls Remaining',
    current_rr: 'Current Run Rate (CRR)',
    last_12_wickets: 'Recent Wickets Lost',
    last_12_runs: 'Recent 12-Ball Scoring Momentum',
    last_6_runs: 'Recent 6-Ball Scoring Momentum',
    last_18_runs: 'Recent 18-Ball Scoring Momentum',
    team_batting_winrate: 'Batting Team Franchise Win %',
    team_bowling_winrate: 'Defending Team Franchise Win %',
    venue_chasing_winrate: 'Venue Historical Chasing Win %',
    dot_ball_ratio: 'Dot Ball Pressure %',
    boundary_ratio: 'Boundary Rate %',
    is_death_overs: 'Death Overs Pressure Phase (16-20)',
    is_powerplay: 'Powerplay Phase (1-6)',
    toss_winner_batting: 'Toss Advantage'
  };
  return map[feat] || feat;
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'CricMystic' });
});

app.get('/api/summary', (req: Request, res: Response) => {
  res.json(iplSummary);
});

app.get('/api/teams', (req: Request, res: Response) => {
  const teamsList = Object.keys(teamMetadata).map(teamName => ({
    name: teamName,
    ...teamMetadata[teamName],
    stats: teamsData[teamName] || { matches: 0, wins: 0, losses: 0 }
  }));
  res.json(teamsList);
});

app.get('/api/venues', (req: Request, res: Response) => {
  const venuesList = Object.keys(venuesData).map(venueName => {
    const v = venuesData[venueName] || {};
    const matches = v.matches || 0;
    const chasingWins = v.chasingWins || 0;
    const batFirstWins = v.batFirstWins || 0;
    const ties = Math.max(0, matches - chasingWins - batFirstWins);
    const chasingWinRate = v.chasingWinRate !== undefined 
      ? Math.round(v.chasingWinRate * 1000) / 10 
      : (matches > 0 ? Math.round((chasingWins / matches) * 1000) / 10 : 50.0);

    return {
      name: venueName,
      city: v.city || '',
      matches,
      chasingWins,
      batFirstWins,
      ties,
      chasingWinRate,
      avg1stInningsScore: 168
    };
  }).sort((a, b) => b.matches - a.matches);
  res.json(venuesList);
});

app.get('/api/seasons', (req: Request, res: Response) => {
  const list = Array.isArray(seasonsData) ? seasonsData : Object.values(seasonsData);
  res.json(list);
});

app.get('/api/players', (req: Request, res: Response) => {
  res.json(playersData);
});

app.get('/api/matches', (req: Request, res: Response) => {
  const season = req.query.season as string;
  const team = req.query.team as string;
  const venue = req.query.venue as string;
  const search = req.query.search as string;
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  let filtered = [...matchesIndex];

  if (season && season !== 'ALL') {
    filtered = filtered.filter(m => String(m.season) === String(season));
  }
  if (team && team !== 'ALL') {
    filtered = filtered.filter(m => (m.team1 === team || m.team2 === team));
  }
  if (venue && venue !== 'ALL') {
    filtered = filtered.filter(m => m.venue.toLowerCase().includes(venue.toLowerCase()));
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.team1.toLowerCase().includes(q) ||
      m.team2.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      String(m.season).includes(q) ||
      (m.playerOfMatch && m.playerOfMatch.toLowerCase().includes(q)) ||
      (m.player_of_match && m.player_of_match.toLowerCase().includes(q))
    );
  }

  // Reverse sort by date for latest first
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    total,
    matches: paginated,
    limit,
    offset
  });
});

// Dynamic Replay Endpoint
app.get('/api/replay/:match_id', (req: Request, res: Response) => {
  try {
    const rawMatchId = req.params.match_id ? req.params.match_id.trim() : '';
    let matchInfo = matchesIndex.find(m => (
      String(m.matchId) === rawMatchId || 
      String(m.match_id) === rawMatchId
    ));

    if (!matchInfo) {
      // Check if turningPoints has this match or find closest match
      const tpEntry = turningPoints[rawMatchId];
      if (tpEntry) {
        matchInfo = {
          matchId: rawMatchId,
          match_id: rawMatchId,
          season: tpEntry.season || 2026,
          date: tpEntry.date || '2026-05-31',
          venue: tpEntry.venue || 'Narendra Modi Stadium, Ahmedabad',
          city: 'Ahmedabad',
          team1: tpEntry.team1 || 'Royal Challengers Bengaluru',
          team2: tpEntry.team2 || 'Gujarat Titans',
          winner: tpEntry.winner || 'Royal Challengers Bengaluru',
          target: 180,
          firstInningsScore: 179
        };
      } else if (matchesIndex.length > 0) {
        matchInfo = matchesIndex[0];
      } else {
        return res.status(404).json({ error: 'Match not found in IPL dataset' });
      }
    }

    const matchId = String(matchInfo.matchId || matchInfo.match_id || rawMatchId);
    const jsonFile = path.join(RAW_DIR, `${matchId}.json`);
    const csvFile = path.join(RAW_DIR, `${matchId}.csv`);

  interface DeliveryPayload {
    innings: number;
    over: number;
    ball: number;
    deliveryLabel: string;
    actualBallNum: number;
    battingTeam: string;
    bowlingTeam: string;
    striker: string;
    nonStriker: string;
    bowler: string;
    runsOffBat: number;
    extras: number;
    totalRuns: number;
    isWicket: boolean;
    wicketType: string;
    playerDismissed: string;
    cumRuns: number;
    cumWickets: number;
    currentRR: number;
    requiredRR: number;
    target: number;
    battingWinProb: number;
    bowlingWinProb: number;
    probSwing: number;
    eventLabel: string;
    momentum: 'Rising' | 'Stable' | 'Falling';
  }

  const deliveries: DeliveryPayload[] = [];
  const target = matchInfo.target || matchInfo.target_runs || (matchInfo.firstInningsScore ? matchInfo.firstInningsScore + 1 : 175);

  if (fs.existsSync(jsonFile)) {
    try {
      const matchData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const rawInnings = matchData.innings || [];

      let cumRuns1 = 0, cumWkts1 = 0, legalBalls1 = 0;
      let cumRuns2 = 0, cumWkts2 = 0, legalBalls2 = 0;
      let prevProb = 50.0;
      const recentRuns: number[] = [];
      const recentWkts: number[] = [];

      for (let innIdx = 0; innIdx < Math.min(2, rawInnings.length); innIdx++) {
        const inn = rawInnings[innIdx];
        const innings = innIdx + 1;
        const battingTeam = inn.team || (innings === 1 ? matchInfo.team1 : matchInfo.team2);
        const bowlingTeam = innings === 1 ? matchInfo.team2 : matchInfo.team1;

        const overs = inn.overs || [];
        for (const overObj of overs) {
          const overNum = overObj.over || 0;
          for (const d of overObj.deliveries || []) {
            const striker = d.batter || 'Batter';
            const bowler = d.bowler || 'Bowler';
            const nonStriker = d.non_striker || 'Non-Striker';
            const runsOffBat = d.runs?.batter ?? 0;
            const extras = d.runs?.extras ?? 0;
            const totalRuns = d.runs?.total ?? (runsOffBat + extras);

            const wides = d.extras?.wides ?? 0;
            const noballs = d.extras?.noballs ?? 0;
            const isLegal = (wides === 0 && noballs === 0);

            const wicketsList = d.wickets || [];
            const isWicket = wicketsList.length > 0;
            const wicketType = isWicket ? (wicketsList[0].kind || 'out') : '';
            const playerDismissed = isWicket ? (wicketsList[0].player_out || striker) : '';

            let cumR = 0, cumW = 0, actualB = 0;
            if (innings === 1) {
              cumRuns1 += totalRuns;
              if (isWicket && wicketType !== 'retired hurt') cumWkts1++;
              if (isLegal) legalBalls1++;
              cumR = cumRuns1;
              cumW = cumWkts1;
              actualB = legalBalls1;
            } else {
              cumRuns2 += totalRuns;
              if (isWicket && wicketType !== 'retired hurt') cumWkts2++;
              if (isLegal) legalBalls2++;
              cumR = cumRuns2;
              cumW = cumWkts2;
              actualB = legalBalls2;
              recentRuns.push(totalRuns);
              recentWkts.push(isWicket ? 1 : 0);
            }

            const currentRR = actualB > 0 ? (cumR / (actualB / 6)) : 0;
            const ballsRemaining = Math.max(0, 120 - actualB);
            const runsRequired = Math.max(0, target - cumR);
            const requiredRR = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)) : (runsRequired > 0 ? 99 : 0);

            let batProb = 50.0;
            if (innings === 1) {
              const projectedScore = cumR + (ballsRemaining / 6) * Math.max(7.5, currentRR);
              batProb = Math.min(95, Math.max(15, Math.round((projectedScore / 185) * 50 * 10) / 10));
            } else {
              const pred = computeWinProbability({
                battingTeam,
                bowlingTeam,
                venue: matchInfo.venue,
                innings: 2,
                currentScore: cumR,
                wicketsLost: cumW,
                overs: Math.floor(actualB / 6) + (actualB % 6) / 10,
                target,
                last6Runs: recentRuns.slice(-6).reduce((a, b) => a + b, 0),
                last12Runs: recentRuns.slice(-12).reduce((a, b) => a + b, 0),
                last18Runs: recentRuns.slice(-18).reduce((a, b) => a + b, 0),
                last12Wickets: recentWkts.slice(-12).reduce((a, b) => a + b, 0)
              });
              batProb = pred.battingProbability;
            }

            const swing = Math.round((batProb - prevProb) * 10) / 10;
            let momentum: 'Rising' | 'Stable' | 'Falling' = 'Stable';
            if (swing >= 3.0) momentum = 'Rising';
            else if (swing <= -3.0) momentum = 'Falling';

            let eventLabel = '';
            if (isWicket) eventLabel = `WICKET (${wicketType})`;
            else if (runsOffBat === 6) eventLabel = 'SIX';
            else if (runsOffBat === 4) eventLabel = 'FOUR';
            else if (wides > 0) eventLabel = 'WIDE';
            else if (noballs > 0) eventLabel = 'NO BALL';
            else if (totalRuns === 0) eventLabel = 'DOT';

            const compOvers = Math.floor((actualB - (isLegal ? 1 : 0)) / 6);
            const ballInOv = ((actualB - (isLegal ? 1 : 0)) % 6) + (isLegal ? 1 : 0);

            deliveries.push({
              innings,
              over: compOvers,
              ball: ballInOv,
              deliveryLabel: `${compOvers}.${ballInOv}`,
              actualBallNum: actualB,
              battingTeam,
              bowlingTeam,
              striker,
              nonStriker,
              bowler,
              runsOffBat,
              extras,
              totalRuns,
              isWicket,
              wicketType,
              playerDismissed,
              cumRuns: cumR,
              cumWickets: cumW,
              currentRR: Math.round(currentRR * 100) / 100,
              requiredRR: Math.round(requiredRR * 100) / 100,
              target,
              battingWinProb: batProb,
              bowlingWinProb: Math.round((100 - batProb) * 10) / 10,
              probSwing: swing,
              eventLabel,
              momentum
            });

            prevProb = batProb;
          }
        }
      }
    } catch (err) {
      console.error('Error parsing JSON replay:', err);
    }
  } else if (fs.existsSync(csvFile)) {
    const rawCsv = fs.readFileSync(csvFile, 'utf-8');
    const lines = rawCsv.split('\n');
    const header = lines[0].split(',').map(h => h.trim());

    const idxInn = header.indexOf('innings');
    const idxBall = header.indexOf('ball');
    const idxBatTeam = header.indexOf('batting_team');
    const idxBowlTeam = header.indexOf('bowling_team');
    const idxStriker = header.indexOf('striker');
    const idxNonStriker = header.indexOf('non_striker');
    const idxBowler = header.indexOf('bowler');
    const idxRunsBat = header.indexOf('runs_off_bat');
    const idxExtras = header.indexOf('extras');
    const idxWides = header.indexOf('wides');
    const idxNoBalls = header.indexOf('noballs');
    const idxWicketType = header.indexOf('wicket_type');
    const idxPlayerDismissed = header.indexOf('player_dismissed');

    let cumRuns1 = 0, cumWkts1 = 0, legalBalls1 = 0;
    let cumRuns2 = 0, cumWkts2 = 0, legalBalls2 = 0;
    let prevProb = 50.0;
    const recentRuns: number[] = [];
    const recentWkts: number[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const row: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === ',' && !inQuotes) { row.push(cur); cur = ''; }
        else cur += ch;
      }
      row.push(cur);

      const innings = parseInt(row[idxInn] || '1', 10);
      if (innings > 2) continue;

      const ballFloat = parseFloat(row[idxBall] || '0.1');
      const over = Math.floor(ballFloat);
      const ballInOver = Math.round((ballFloat - over) * 10);
      const battingTeam = row[idxBatTeam]?.replace(/"/g, '') || matchInfo.team1;
      const bowlingTeam = row[idxBowlTeam]?.replace(/"/g, '') || matchInfo.team2;
      const striker = row[idxStriker]?.replace(/"/g, '') || 'Striker';
      const nonStriker = row[idxNonStriker]?.replace(/"/g, '') || 'Non-Striker';
      const bowler = row[idxBowler]?.replace(/"/g, '') || 'Bowler';
      const runsOffBat = parseInt(row[idxRunsBat] || '0', 10);
      const extras = parseInt(row[idxExtras] || '0', 10);
      const wides = parseInt(row[idxWides] || '0', 10);
      const noballs = parseInt(row[idxNoBalls] || '0', 10);
      const wicketType = row[idxWicketType]?.replace(/"/g, '') || '';
      const playerDismissed = row[idxPlayerDismissed]?.replace(/"/g, '') || '';
      const isWicket = Boolean(wicketType && wicketType.length > 0);

      const totalRuns = runsOffBat + extras;
      const isLegal = wides === 0 && noballs === 0;

      let cumR = 0, cumW = 0, actualB = 0;
      if (innings === 1) {
        cumRuns1 += totalRuns;
        if (isWicket) cumWkts1++;
        if (isLegal) legalBalls1++;
        cumR = cumRuns1;
        cumW = cumWkts1;
        actualB = legalBalls1;
      } else {
        cumRuns2 += totalRuns;
        if (isWicket) cumWkts2++;
        if (isLegal) legalBalls2++;
        cumR = cumRuns2;
        cumW = cumWkts2;
        actualB = legalBalls2;
        recentRuns.push(totalRuns);
        recentWkts.push(isWicket ? 1 : 0);
      }

      const currentRR = actualB > 0 ? (cumR / (actualB / 6)) : 0;
      const ballsRemaining = Math.max(0, 120 - actualB);
      const runsRequired = Math.max(0, target - cumR);
      const requiredRR = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)) : (runsRequired > 0 ? 99 : 0);

      let batProb = 50.0;
      if (innings === 1) {
        const projectedScore = cumR + (ballsRemaining / 6) * Math.max(7.5, currentRR);
        batProb = Math.min(95, Math.max(15, Math.round((projectedScore / 185) * 50 * 10) / 10));
      } else {
        const pred = computeWinProbability({
          battingTeam,
          bowlingTeam,
          venue: matchInfo.venue,
          innings: 2,
          currentScore: cumR,
          wicketsLost: cumW,
          overs: over + ballInOver / 10,
          target,
          last6Runs: recentRuns.slice(-6).reduce((a, b) => a + b, 0),
          last12Runs: recentRuns.slice(-12).reduce((a, b) => a + b, 0),
          last18Runs: recentRuns.slice(-18).reduce((a, b) => a + b, 0),
          last12Wickets: recentWkts.slice(-12).reduce((a, b) => a + b, 0)
        });
        batProb = pred.battingProbability;
      }

      const swing = Math.round((batProb - prevProb) * 10) / 10;
      let momentum: 'Rising' | 'Stable' | 'Falling' = 'Stable';
      if (swing >= 3.0) momentum = 'Rising';
      else if (swing <= -3.0) momentum = 'Falling';

      let eventLabel = '';
      if (isWicket) eventLabel = `WICKET (${wicketType})`;
      else if (runsOffBat === 6) eventLabel = 'SIX';
      else if (runsOffBat === 4) eventLabel = 'FOUR';
      else if (wides > 0) eventLabel = 'WIDE';
      else if (noballs > 0) eventLabel = 'NO BALL';
      else if (totalRuns === 0) eventLabel = 'DOT';

      deliveries.push({
        innings,
        over,
        ball: ballInOver,
        deliveryLabel: `${over}.${ballInOver}`,
        actualBallNum: actualB,
        battingTeam,
        bowlingTeam,
        striker,
        nonStriker,
        bowler,
        runsOffBat,
        extras,
        totalRuns,
        isWicket,
        wicketType,
        playerDismissed,
        cumRuns: cumR,
        cumWickets: cumW,
        currentRR: Math.round(currentRR * 100) / 100,
        requiredRR: Math.round(requiredRR * 100) / 100,
        target,
        battingWinProb: batProb,
        bowlingWinProb: Math.round((100 - batProb) * 10) / 10,
        probSwing: swing,
        eventLabel,
        momentum
      });

      prevProb = batProb;
    }
  }

  let rawTP = (turningPoints[matchId]?.turningPoints || []).map((tp: any) => ({
    over: Math.floor(parseFloat(tp.over || '0')),
    ball: Math.round((parseFloat(tp.over || '0') % 1) * 10),
    delivery: String(tp.over || '0.0'),
    swing: tp.swing || 0,
    desc: tp.narrative || '',
    probBefore: tp.probBefore || 50,
    probAfter: tp.probAfter || 50,
    isWicket: !!tp.isWicket,
    score: tp.score || ''
  }));

  if (rawTP.length === 0 && deliveries.length > 0) {
    const topDeliveries = [...deliveries]
      .filter(d => Math.abs(d.probSwing || 0) > 0)
      .sort((a, b) => Math.abs(b.probSwing || 0) - Math.abs(a.probSwing || 0))
      .slice(0, 6);

    rawTP = topDeliveries.map(d => ({
      over: d.over,
      ball: d.ball,
      delivery: `${d.over}.${d.ball}`,
      swing: d.probSwing,
      desc: d.eventLabel || (d.isWicket ? `WICKET! ${d.playerDismissed || 'Batter out'}` : `${d.runsOffBat} runs off bat`),
      probBefore: Math.round(((d.battingWinProb || 50) - (d.probSwing || 0)) * 10) / 10,
      probAfter: d.battingWinProb || 50,
      isWicket: !!d.isWicket,
      score: `${d.cumRuns}/${d.cumWickets}`
    }));
  }

  const turningPointData = {
    matchId,
    maxSwing: rawTP.length > 0 ? rawTP[0] : null,
    topSwings: rawTP,
    turningPoints: rawTP
  };

  res.json({
    match: matchInfo,
    turningPoints: turningPointData,
    deliveriesCount: deliveries.length,
    innings1Deliveries: deliveries.filter(d => d.innings === 1),
    innings2Deliveries: deliveries.filter(d => d.innings === 2),
    allDeliveries: deliveries
  });
  } catch (err) {
    console.error('Error serving match replay:', err);
    res.status(500).json({ error: 'Failed to process match replay data' });
  }
});

// POST /api/predict
app.post('/api/predict', (req: Request, res: Response) => {
  try {
    const {
      battingTeam,
      bowlingTeam,
      venue,
      innings = 2,
      currentScore = 0,
      wicketsLost = 0,
      overs = 0.0,
      target = 180,
      tossWinner,
      tossDecision,
      last6Runs,
      last12Runs,
      last18Runs,
      last12Wickets,
      dotRatio,
      boundaryRatio
    } = req.body;

    if (!battingTeam || !bowlingTeam) {
      return res.status(400).json({ error: 'battingTeam and bowlingTeam are required.' });
    }

    const prediction = computeWinProbability({
      battingTeam,
      bowlingTeam,
      venue: venue || 'M. Chinnaswamy Stadium, Bengaluru',
      innings: Number(innings),
      currentScore: Number(currentScore),
      wicketsLost: Number(wicketsLost),
      overs: Number(overs),
      target: Number(target),
      tossWinner,
      tossDecision,
      last6Runs: last6Runs !== undefined ? Number(last6Runs) : undefined,
      last12Runs: last12Runs !== undefined ? Number(last12Runs) : undefined,
      last18Runs: last18Runs !== undefined ? Number(last18Runs) : undefined,
      last12Wickets: last12Wickets !== undefined ? Number(last12Wickets) : undefined,
      dotRatio: dotRatio !== undefined ? Number(dotRatio) : undefined,
      boundaryRatio: boundaryRatio !== undefined ? Number(boundaryRatio) : undefined
    });

    res.json(prediction);
  } catch (error: any) {
    console.error('Prediction API error:', error);
    res.status(500).json({ error: 'Failed to compute win probability' });
  }
});

// POST /api/simulate (What-If engine)
app.post('/api/simulate', (req: Request, res: Response) => {
  try {
    const { baseline, modified } = req.body;

    if (!baseline || !modified) {
      return res.status(400).json({ error: 'Both baseline and modified scenario configurations are required.' });
    }

    const baselineResult = computeWinProbability({
      battingTeam: baseline.battingTeam || 'Royal Challengers Bengaluru',
      bowlingTeam: baseline.bowlingTeam || 'Chennai Super Kings',
      venue: baseline.venue || 'M. Chinnaswamy Stadium, Bengaluru',
      innings: 2,
      currentScore: Number(baseline.currentScore || 120),
      wicketsLost: Number(baseline.wicketsLost || 3),
      overs: Number(baseline.overs || 14.0),
      target: Number(baseline.target || 180),
      tossWinner: baseline.tossWinner
    });

    const modifiedResult = computeWinProbability({
      battingTeam: modified.battingTeam || baseline.battingTeam || 'Royal Challengers Bengaluru',
      bowlingTeam: modified.bowlingTeam || baseline.bowlingTeam || 'Chennai Super Kings',
      venue: modified.venue || baseline.venue || 'M. Chinnaswamy Stadium, Bengaluru',
      innings: 2,
      currentScore: Number(modified.currentScore ?? baseline.currentScore ?? 120),
      wicketsLost: Number(modified.wicketsLost ?? baseline.wicketsLost ?? 3),
      overs: Number(modified.overs ?? baseline.overs ?? 14.0),
      target: Number(modified.target ?? baseline.target ?? 180),
      tossWinner: modified.tossWinner || baseline.tossWinner
    });

    const deltaProbability = Math.round((modifiedResult.battingProbability - baselineResult.battingProbability) * 10) / 10;

    let narrative = '';
    if (deltaProbability > 10) {
      narrative = `Massive swing of +${deltaProbability}% in favour of ${modified.battingTeam || baseline.battingTeam}! The modified state significantly alleviates run rate pressure.`;
    } else if (deltaProbability > 0) {
      narrative = `Positive improvement of +${deltaProbability}% for ${modified.battingTeam || baseline.battingTeam}.`;
    } else if (deltaProbability < -10) {
      narrative = `Severe downturn of ${deltaProbability}%! The modified wickets or deficit heavily tilts odds towards ${modified.bowlingTeam || baseline.bowlingTeam}.`;
    } else if (deltaProbability < 0) {
      narrative = `Slight drop of ${deltaProbability}% in win probability.`;
    } else {
      narrative = 'No net change in win probability between scenarios.';
    }

    res.json({
      baseline: baselineResult,
      modified: modifiedResult,
      deltaProbability,
      narrative
    });
  } catch (error: any) {
    console.error('Simulation API error:', error);
    res.status(500).json({ error: 'Failed to simulate match scenario' });
  }
});

// GET /api/model-metrics & /api/model/metrics
app.get(['/api/model-metrics', '/api/model/metrics'], (req: Request, res: Response) => {
  res.json(modelArtifacts);
});

// GET /api/mystic-moments
app.get('/api/mystic-moments', (req: Request, res: Response) => {
  res.json(mysticMoments);
});

// GET /api/did-you-know
app.get('/api/did-you-know', (req: Request, res: Response) => {
  res.json(didYouKnow);
});

// GET /api/challenges & /api/analyst-challenges
app.get(['/api/challenges', '/api/analyst-challenges'], (req: Request, res: Response) => {
  res.json(analystChallenges);
});

// GET /api/mystic-challenges
app.get('/api/mystic-challenges', (req: Request, res: Response) => {
  res.json(mysticChallenges);
});

// GET /api/turning-points
app.get('/api/turning-points', (req: Request, res: Response) => {
  res.json(turningPoints);
});

// GET /api/head-to-head
app.get('/api/head-to-head', (req: Request, res: Response) => {
  const team1 = req.query.team1 as string;
  const team2 = req.query.team2 as string;

  if (!team1 || !team2) {
    return res.status(400).json({ error: 'team1 and team2 are required parameters' });
  }

  const h2hMatches = matchesIndex.filter(m =>
    (m.team1 === team1 && m.team2 === team2) ||
    (m.team1 === team2 && m.team2 === team1)
  );

  let team1Wins = 0;
  let team2Wins = 0;
  let noResults = 0;
  let team1TotalRuns = 0;
  let team2TotalRuns = 0;
  let team1HighScore = 0;
  let team2HighScore = 0;

  for (const m of h2hMatches) {
    if (m.winner === team1) team1Wins++;
    else if (m.winner === team2) team2Wins++;
    else noResults++;

    const inn1 = m.innings1_runs || m.firstInningsScore || 0;
    const inn2 = m.innings2_runs || (m.target ? m.target - 1 : 0);

    if (m.team1 === team1) {
      team1TotalRuns += inn1;
      if (inn1 > team1HighScore) team1HighScore = inn1;
      team2TotalRuns += inn2;
      if (inn2 > team2HighScore) team2HighScore = inn2;
    } else {
      team2TotalRuns += inn1;
      if (inn1 > team2HighScore) team2HighScore = inn1;
      team1TotalRuns += inn2;
      if (inn2 > team1HighScore) team1HighScore = inn2;
    }
  }

  const total = h2hMatches.length;

  res.json({
    team1,
    team2,
    totalMatches: total,
    team1Wins,
    team2Wins,
    noResults,
    team1WinRate: total > 0 ? Math.round((team1Wins / total) * 1000) / 10 : 0,
    team2WinRate: total > 0 ? Math.round((team2Wins / total) * 1000) / 10 : 0,
    team1HighScore,
    team2HighScore,
    team1AvgScore: total > 0 ? Math.round(team1TotalRuns / total) : 0,
    team2AvgScore: total > 0 ? Math.round(team2TotalRuns / total) : 0,
    recentMatches: h2hMatches.slice(0, 10)
  });
});

// Vite Middleware for SPA development & static serving in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ CricMystic Server running on port ${PORT}`);
  });
}

start();
