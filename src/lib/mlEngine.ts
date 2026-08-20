/**
 * CricMystic - Client-Side Real-Time Inference & Simulation Engine
 * Executes Calibrated Logistic Regression model with 0ms latency in the browser.
 * Ensures CricMystic is 100% functional on Netlify static hosting without backend dependency.
 */

export interface MatchStateInput {
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
}

export interface FactorContribution {
  feature: string;
  label: string;
  contribution: number;
  impact: 'favours_batting' | 'favours_bowling';
  explanation: string;
}

export interface PredictionResult {
  battingWinProb: number; // 0 to 100
  bowlingWinProb: number; // 0 to 100
  battingTeam: string;
  bowlingTeam: string;
  rawProbability: number;
  calibratedProbability: number;
  modelConfidence: 'High' | 'Moderate' | 'Very High' | 'Critical Phase';
  dominantFactors: FactorContribution[];
  recommendation: string;
  matchContext: {
    overs: number;
    score: number;
    wickets: number;
    ballsRemaining: number;
    runsRequired: number;
    target: number;
    currentRunRate: number;
    requiredRunRate: number;
    crr: number;
    rrr: number;
  };
}

let cachedArtifacts: any = null;
let cachedTeams: Record<string, any> = {};
let cachedVenues: Record<string, any> = {};

export async function initMlEngine() {
  if (cachedArtifacts) return;
  try {
    const [modelRes, teamsRes, venuesRes] = await Promise.all([
      fetch('/data/model_artifacts.json'),
      fetch('/data/teams_data.json'),
      fetch('/data/venues_data.json')
    ]);
    if (modelRes.ok) cachedArtifacts = await modelRes.json();
    if (teamsRes.ok) cachedTeams = await teamsRes.json();
    if (venuesRes.ok) cachedVenues = await venuesRes.json();
  } catch (err) {
    console.warn('[!] Failed to prefetch static ML artifacts:', err);
  }
}

export function predictWinProbability(params: MatchStateInput): PredictionResult {
  const overNum = Math.floor(params.overs);
  const ballsInOver = Math.round((params.overs - overNum) * 10);
  const legalBallsBowled = Math.min(120, overNum * 6 + ballsInOver);
  const ballsRemaining = Math.max(0, 120 - legalBallsBowled);
  const target = params.target || (params.innings === 1 ? 175 : params.currentScore + 1);
  const runsRequired = Math.max(0, target - params.currentScore);
  const wicketsRemaining = Math.max(0, 10 - params.wicketsLost);

  const crr = legalBallsBowled > 0 ? params.currentScore / (legalBallsBowled / 6) : 0;
  const rrr = ballsRemaining > 0 ? runsRequired / (ballsRemaining / 6) : runsRequired > 0 ? 99 : 0;
  const rrrCrrDiff = rrr - crr;
  const chaseProgress = target > 0 ? params.currentScore / target : 0;

  // Real priors with neutral fallbacks (no fabricated counts)
  const batTeamStats = cachedTeams[params.battingTeam];
  const bowlTeamStats = cachedTeams[params.bowlingTeam];
  const batWinRate = batTeamStats && batTeamStats.matches > 0 ? batTeamStats.wins / batTeamStats.matches : 0.5;
  const bowlWinRate = bowlTeamStats && bowlTeamStats.matches > 0 ? bowlTeamStats.wins / bowlTeamStats.matches : 0.5;

  const venueStat = cachedVenues[params.venue];
  const venueChasingWinRate = venueStat && venueStat.matches > 0 ? venueStat.chasingWins / venueStat.matches : 0.528;

  const tossWinnerBatting = params.tossWinner ? (params.tossWinner === params.battingTeam ? 1 : 0) : 1;

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

  const featureKeys: string[] = cachedArtifacts?.featureKeys || [
    'balls_remaining', 'runs_required', 'wickets_remaining', 'current_rr',
    'required_rr', 'rrr_crr_diff', 'chase_progress', 'last_6_runs',
    'last_12_runs', 'last_18_runs', 'last_12_wickets', 'team_batting_winrate',
    'team_bowling_winrate', 'venue_chasing_winrate', 'dot_ball_ratio',
    'boundary_ratio', 'is_death_overs', 'is_powerplay', 'toss_winner_batting'
  ];

  const featureMeans: Record<string, number> = cachedArtifacts?.featureMeans || {};
  const featureStds: Record<string, number> = cachedArtifacts?.featureStds || {};
  const weights: number[] = cachedArtifacts?.weights || [];
  const bias: number = cachedArtifacts?.bias || 0;

  let z = bias;
  const factorContributions: FactorContribution[] = [];

  for (let j = 0; j < featureKeys.length; j++) {
    const k = featureKeys[j];
    const val = stateObj[k] ?? 0;
    const m = featureMeans[k] || 0;
    const s = featureStds[k] || 1;
    const norm = (val - m) / s;
    const w = weights[j] || 0;
    const contrib = w * norm;
    z += contrib;

    let expl = '';
    if (k === 'required_rr') {
      expl = rrr > 12 
        ? `Stiff required rate of ${rrr.toFixed(2)} RPO creates extreme scoreboard pressure.`
        : `Manageable required rate of ${rrr.toFixed(2)} RPO gives batting lineup control.`;
    } else if (k === 'wickets_remaining') {
      expl = wicketsRemaining >= 6 
        ? `${wicketsRemaining} wickets in hand provides depth for aggressive strokeplay.`
        : `Only ${wicketsRemaining} wickets in hand amplifies collapse risk.`;
    } else if (k === 'current_rr') {
      expl = `Scoring at ${crr.toFixed(2)} RPO sustains required boundary momentum.`;
    } else if (k === 'chase_progress') {
      expl = `Target ${(chaseProgress * 100).toFixed(0)}% completed (${params.currentScore}/${target}).`;
    } else if (k === 'runs_required') {
      expl = `${runsRequired} runs required off ${ballsRemaining} balls.`;
    } else if (k === 'rrr_crr_diff') {
      expl = rrrCrrDiff > 3 
        ? `Run rate deficit of ${rrrCrrDiff.toFixed(2)} RPO favours bowling defense.`
        : `Current run rate matches or exceeds required scoring pace.`;
    } else if (k === 'last_12_wickets') {
      expl = (params.last12Wickets || 0) > 0 
        ? `${params.last12Wickets} wicket(s) lost in recent overs caused a stutter.`
        : `Solid partnership without recent wickets stabilizes the chase.`;
    } else if (k === 'venue_chasing_winrate') {
      expl = `${params.venue || 'Venue'} historical chasing win rate stands at ${(venueChasingWinRate * 100).toFixed(1)}%.`;
    } else if (k === 'team_batting_winrate') {
      expl = `${params.battingTeam} overall franchise win rate stands at ${(batWinRate * 100).toFixed(1)}%.`;
    }

    if (expl) {
      factorContributions.push({
        feature: k,
        label: k.replace(/_/g, ' ').toUpperCase(),
        contribution: Math.round(contrib * 100) / 100,
        impact: contrib >= 0 ? 'favours_batting' : 'favours_bowling',
        explanation: expl
      });
    }
  }

  // Clamped Sigmoid
  const zClamped = Math.max(-25, Math.min(25, z));
  const rawP = 1 / (1 + Math.exp(-zClamped));

  // Platt Scaling Calibration
  const a = cachedArtifacts?.platt_a || 1.0;
  const b = cachedArtifacts?.platt_b || 0.0;
  const calibZ = Math.max(-25, Math.min(25, a * (Math.log(Math.max(1e-6, rawP) / Math.max(1e-6, 1 - rawP))) + b));
  let calibP = 1 / (1 + Math.exp(-calibZ));

  // Boundary condition checks
  if (runsRequired <= 0 && legalBallsBowled > 0) calibP = 1.0;
  if (wicketsRemaining <= 0 && runsRequired > 0) calibP = 0.0;
  if (ballsRemaining <= 0 && runsRequired > 0) calibP = 0.0;

  const battingWinProb = Math.min(99.9, Math.max(0.1, Math.round(calibP * 1000) / 10));
  const bowlingWinProb = Math.min(99.9, Math.max(0.1, Math.round((100 - battingWinProb) * 10) / 10));

  factorContributions.sort((x, y) => Math.abs(y.contribution) - Math.abs(x.contribution));

  let confidence: 'High' | 'Moderate' | 'Very High' | 'Critical Phase' = 'Moderate';
  if (legalBallsBowled >= 96) confidence = 'Critical Phase';
  else if (battingWinProb >= 85 || battingWinProb <= 15) confidence = 'Very High';
  else if (battingWinProb >= 70 || battingWinProb <= 30) confidence = 'High';

  let recommendation = '';
  if (battingWinProb >= 65) {
    recommendation = `${params.battingTeam} is in command. Maintaining current tempo without losing clusters of wickets will see them home comfortably.`;
  } else if (battingWinProb <= 35) {
    recommendation = `${params.bowlingTeam} has built decisive scoreboard pressure. ${params.battingTeam} urgently needs an aggressive 15+ run over to swing momentum.`;
  } else {
    recommendation = `The match is on a knife edge! A single boundary or a key wicket will swing win probability by 15-25%.`;
  }

  return {
    battingWinProb,
    bowlingWinProb,
    battingTeam: params.battingTeam,
    bowlingTeam: params.bowlingTeam,
    rawProbability: Math.round(rawP * 1000) / 10,
    calibratedProbability: battingWinProb,
    modelConfidence: confidence,
    dominantFactors: factorContributions.slice(0, 5),
    recommendation,
    matchContext: {
      overs: params.overs,
      score: params.currentScore,
      wickets: params.wicketsLost,
      ballsRemaining,
      runsRequired,
      target,
      currentRunRate: Math.round(crr * 100) / 100,
      requiredRunRate: Math.round(rrr * 100) / 100,
      crr: Math.round(crr * 100) / 100,
      rrr: Math.round(rrr * 100) / 100
    }
  };
}
