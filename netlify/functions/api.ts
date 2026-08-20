import iplSummaryData from '../../data/processed/ipl_summary.json';
import modelArtifactsData from '../../data/processed/model_artifacts.json';
import matchesIndexData from '../../data/processed/matches_index.json';
import teamsDataObj from '../../data/processed/teams_data.json';
import teamMetadataObj from '../../data/processed/team_metadata.json';
import venuesDataObj from '../../data/processed/venues_data.json';
import seasonsDataList from '../../data/processed/seasons_data.json';
import playersDataObj from '../../data/processed/players_data.json';
import mysticMomentsList from '../../data/processed/mystic_moments.json';
import didYouKnowList from '../../data/processed/did_you_know.json';
import analystChallengesList from '../../data/processed/analyst_challenges.json';
import mysticChallengesList from '../../data/processed/mystic_challenges.json';

const iplSummary: any = iplSummaryData;
const modelArtifacts: any = modelArtifactsData;
const matchesIndex: any[] = matchesIndexData as any[];
const teamsData: Record<string, any> = teamsDataObj;
const teamMetadata: Record<string, any> = teamMetadataObj;
const venuesData: Record<string, any> = venuesDataObj;
const seasonsData: any[] = seasonsDataList;
const playersData: any = playersDataObj;
const mysticMoments: any[] = mysticMomentsList;
const didYouKnow: any[] = didYouKnowList;
const analystChallenges: any[] = analystChallengesList;
const mysticChallenges: any[] = mysticChallengesList;

// ----------------------------------------------------
// Calibrated ML Win Probability Engine
// ----------------------------------------------------

export interface WinProbParams {
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

export function computeWinProbability(params: WinProbParams) {
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
    const contrib = (weights[j] || 0) * norm;
    z += contrib;

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
// Replay Timeline Synthesizer & ML Evaluator
// ----------------------------------------------------

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

function generateMatchReplayData(matchInfo: any) {
  const matchId = String(matchInfo.matchId || matchInfo.match_id);
  const target = matchInfo.target || matchInfo.target_runs || (matchInfo.firstInningsScore ? matchInfo.firstInningsScore + 1 : 175);
  const team1 = matchInfo.team1 || 'Team 1';
  const team2 = matchInfo.team2 || 'Team 2';
  const winner = matchInfo.winner || team1;
  const pom = matchInfo.playerOfMatch || matchInfo.player_of_match || 'Star Player';

  const deliveries: DeliveryPayload[] = [];
  let prevProb = 50.0;

  // Innings 1
  const inn1Score = matchInfo.firstInningsScore || 165;
  const inn1Balls = 120;
  const inn1WicketsTotal = winner === team1 && matchInfo.margin?.includes('wickets') ? 5 : 7;
  let cumRuns1 = 0;
  let cumWkts1 = 0;

  // Deterministic seed sequence based on matchId
  let seed = 0;
  for (let i = 0; i < matchId.length; i++) seed = (seed * 31 + matchId.charCodeAt(i)) % 100000;

  const getPseudo = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let b = 1; b <= inn1Balls; b++) {
    const compOvers = Math.floor((b - 1) / 6);
    const ballInOv = ((b - 1) % 6) + 1;
    const runsRemaining = inn1Score - cumRuns1;
    const ballsLeft = inn1Balls - b + 1;
    const expRunRate = ballsLeft > 0 ? runsRemaining / ballsLeft : 1;

    let runsOffBat = 0;
    let extras = 0;
    let isWicket = false;
    let wicketType = '';

    const rnd = getPseudo();
    if (rnd < 0.38) runsOffBat = 0;
    else if (rnd < 0.72) runsOffBat = 1;
    else if (rnd < 0.82) runsOffBat = 2;
    else if (rnd < 0.93) runsOffBat = 4;
    else if (rnd < 0.98) runsOffBat = 6;
    else runsOffBat = 1;

    if (cumWkts1 < inn1WicketsTotal && (b % Math.floor(inn1Balls / (inn1WicketsTotal + 1)) === 0 || rnd > 0.96 && cumWkts1 < 9)) {
      isWicket = true;
      wicketType = 'caught';
      cumWkts1++;
    }

    if (runsOffBat + cumRuns1 > inn1Score && b < inn1Balls) {
      runsOffBat = Math.max(0, inn1Score - cumRuns1);
    }
    if (b === inn1Balls) {
      runsOffBat = Math.max(0, inn1Score - cumRuns1);
    }

    cumRuns1 += runsOffBat;
    const currentRR = b > 0 ? (cumRuns1 / (b / 6)) : 0;
    const ballsRemaining = 120 - b;
    const projectedScore = cumRuns1 + (ballsRemaining / 6) * Math.max(7.5, currentRR);
    const batProb = Math.min(95, Math.max(15, Math.round((projectedScore / 185) * 50 * 10) / 10));
    const swing = Math.round((batProb - prevProb) * 10) / 10;
    prevProb = batProb;

    let eventLabel = '';
    if (isWicket) eventLabel = `WICKET (${wicketType})`;
    else if (runsOffBat === 6) eventLabel = 'SIX';
    else if (runsOffBat === 4) eventLabel = 'FOUR';
    else if (runsOffBat === 0) eventLabel = 'DOT';

    deliveries.push({
      innings: 1,
      over: compOvers,
      ball: ballInOv,
      deliveryLabel: `${compOvers}.${ballInOv}`,
      actualBallNum: b,
      battingTeam: team1,
      bowlingTeam: team2,
      striker: b <= 60 ? pom : 'Middle Order Batter',
      nonStriker: 'Top Order Batter',
      bowler: `Bowler ${compOvers % 5 + 1}`,
      runsOffBat,
      extras,
      totalRuns: runsOffBat + extras,
      isWicket,
      wicketType,
      playerDismissed: isWicket ? (b <= 60 ? 'Top Order Batter' : 'Middle Order Batter') : '',
      cumRuns: cumRuns1,
      cumWickets: cumWkts1,
      currentRR: Math.round(currentRR * 100) / 100,
      requiredRR: 0,
      target,
      battingWinProb: batProb,
      bowlingWinProb: Math.round((100 - batProb) * 10) / 10,
      probSwing: swing,
      eventLabel,
      momentum: swing >= 3 ? 'Rising' : swing <= -3 ? 'Falling' : 'Stable'
    });
  }

  // Innings 2
  const inn2IsWinner = winner === team2;
  const inn2Target = target;
  const inn2FinalScore = inn2IsWinner ? (target + (getPseudo() > 0.5 ? 1 : 0)) : Math.max(80, target - 12);
  const inn2WicketsTotal = inn2IsWinner ? (matchInfo.margin?.includes('wickets') ? 10 - parseInt(matchInfo.margin, 10) : 5) : 9;
  const inn2BallsTotal = inn2IsWinner ? Math.min(120, 108 + Math.floor(getPseudo() * 12)) : 120;

  let cumRuns2 = 0;
  let cumWkts2 = 0;
  const recentRuns: number[] = [];
  const recentWkts: number[] = [];
  prevProb = 50.0;

  for (let b = 1; b <= inn2BallsTotal; b++) {
    const compOvers = Math.floor((b - 1) / 6);
    const ballInOv = ((b - 1) % 6) + 1;
    const runsRemaining = inn2FinalScore - cumRuns2;
    const ballsLeft = inn2BallsTotal - b + 1;

    let runsOffBat = 0;
    let extras = 0;
    let isWicket = false;
    let wicketType = '';

    const rnd = getPseudo();
    if (rnd < 0.36) runsOffBat = 0;
    else if (rnd < 0.68) runsOffBat = 1;
    else if (rnd < 0.78) runsOffBat = 2;
    else if (rnd < 0.90) runsOffBat = 4;
    else if (rnd < 0.97) runsOffBat = 6;
    else runsOffBat = 1;

    if (cumWkts2 < inn2WicketsTotal && (b % Math.max(1, Math.floor(inn2BallsTotal / (inn2WicketsTotal + 1))) === 0 || (rnd > 0.96 && cumWkts2 < inn2WicketsTotal))) {
      isWicket = true;
      wicketType = 'caught';
      cumWkts2++;
    }

    if (runsOffBat + cumRuns2 > inn2FinalScore && b < inn2BallsTotal) {
      runsOffBat = Math.max(0, inn2FinalScore - cumRuns2);
    }
    if (b === inn2BallsTotal) {
      runsOffBat = Math.max(0, inn2FinalScore - cumRuns2);
    }

    cumRuns2 += runsOffBat;
    recentRuns.push(runsOffBat);
    recentWkts.push(isWicket ? 1 : 0);

    const actualB = b;
    const ballsRemaining = Math.max(0, 120 - actualB);
    const runsRequired = Math.max(0, target - cumRuns2);
    const currentRR = actualB > 0 ? (cumRuns2 / (actualB / 6)) : 0;
    const requiredRR = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)) : (runsRequired > 0 ? 99 : 0);

    const pred = computeWinProbability({
      battingTeam: team2,
      bowlingTeam: team1,
      venue: matchInfo.venue,
      innings: 2,
      currentScore: cumRuns2,
      wicketsLost: cumWkts2,
      overs: compOvers + ballInOv / 10,
      target,
      last6Runs: recentRuns.slice(-6).reduce((x, y) => x + y, 0),
      last12Runs: recentRuns.slice(-12).reduce((x, y) => x + y, 0),
      last18Runs: recentRuns.slice(-18).reduce((x, y) => x + y, 0),
      last12Wickets: recentWkts.slice(-12).reduce((x, y) => x + y, 0)
    });

    const batProb = pred.battingProbability;
    const swing = Math.round((batProb - prevProb) * 10) / 10;
    prevProb = batProb;

    let eventLabel = '';
    if (isWicket) eventLabel = `WICKET (${wicketType})`;
    else if (runsOffBat === 6) eventLabel = 'SIX';
    else if (runsOffBat === 4) eventLabel = 'FOUR';
    else if (runsOffBat === 0) eventLabel = 'DOT';

    deliveries.push({
      innings: 2,
      over: compOvers,
      ball: ballInOv,
      deliveryLabel: `${compOvers}.${ballInOv}`,
      actualBallNum: actualB,
      battingTeam: team2,
      bowlingTeam: team1,
      striker: actualB >= 60 && inn2IsWinner ? pom : 'Top Order Batter',
      nonStriker: 'Middle Order Batter',
      bowler: `Bowler ${compOvers % 5 + 1}`,
      runsOffBat,
      extras,
      totalRuns: runsOffBat + extras,
      isWicket,
      wicketType,
      playerDismissed: isWicket ? (actualB < 60 ? 'Top Order Batter' : 'Middle Order Batter') : '',
      cumRuns: cumRuns2,
      cumWickets: cumWkts2,
      currentRR: Math.round(currentRR * 100) / 100,
      requiredRR: Math.round(requiredRR * 100) / 100,
      target,
      battingWinProb: batProb,
      bowlingWinProb: Math.round((100 - batProb) * 10) / 10,
      probSwing: swing,
      eventLabel,
      momentum: swing >= 3 ? 'Rising' : swing <= -3 ? 'Falling' : 'Stable'
    });

    if (cumRuns2 >= target) break;
  }

  // Turning points extraction
  const inn2Deliveries = deliveries.filter(d => d.innings === 2);
  const topSwings = [...inn2Deliveries]
    .filter(d => Math.abs(d.probSwing || 0) > 0)
    .sort((a, b) => Math.abs(b.probSwing || 0) - Math.abs(a.probSwing || 0))
    .slice(0, 8)
    .map(d => ({
      over: d.over,
      ball: d.ball,
      delivery: d.deliveryLabel,
      swing: d.probSwing,
      desc: d.eventLabel || (d.isWicket ? `WICKET! ${d.playerDismissed || 'Batter out'}` : `${d.runsOffBat} runs off bat`),
      probBefore: Math.round(((d.battingWinProb || 50) - (d.probSwing || 0)) * 10) / 10,
      probAfter: d.battingWinProb || 50,
      isWicket: !!d.isWicket,
      score: `${d.cumRuns}/${d.cumWickets}`
    }));

  const turningPointsData = {
    matchId,
    maxSwing: topSwings.length > 0 ? topSwings[0] : null,
    topSwings,
    turningPoints: topSwings
  };

  return {
    match: matchInfo,
    turningPoints: turningPointsData,
    deliveriesCount: deliveries.length,
    innings1Deliveries: deliveries.filter(d => d.innings === 1),
    innings2Deliveries: deliveries.filter(d => d.innings === 2),
    allDeliveries: deliveries
  };
}

// ----------------------------------------------------
// Netlify Serverless Handler Router
// ----------------------------------------------------

export interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string | undefined> | null;
  body: string | null;
  isBase64Encoded?: boolean;
}

export interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'public, max-age=60, s-maxage=300'
};

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  try {
    const rawPath = event.path || '';
    // Normalize path by stripping '/.netlify/functions/api' or '/api' prefix
    let endpoint = rawPath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    const query = event.queryStringParameters || {};
    const method = (event.httpMethod || 'GET').toUpperCase();

    // 1. GET /api/health
    if (endpoint === '/health') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), platform: 'CricMystic Netlify Functions' })
      };
    }

    // 2. GET /api/summary
    if (endpoint === '/summary') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(iplSummary)
      };
    }

    // 3. GET /api/teams
    if (endpoint === '/teams') {
      const teamsList = Object.keys(teamMetadata).map(teamName => ({
        name: teamName,
        ...teamMetadata[teamName],
        stats: teamsData[teamName] || { matches: 0, wins: 0, losses: 0 }
      }));
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(teamsList)
      };
    }

    // 4. GET /api/venues
    if (endpoint === '/venues') {
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

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(venuesList)
      };
    }

    // 5. GET /api/seasons
    if (endpoint === '/seasons') {
      const list = Array.isArray(seasonsData) ? seasonsData : Object.values(seasonsData);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(list)
      };
    }

    // 6. GET /api/players
    if (endpoint === '/players') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(playersData)
      };
    }

    // 7. GET /api/matches
    if (endpoint === '/matches') {
      const season = query.season;
      const team = query.team;
      const venue = query.venue;
      const search = query.search;
      const limit = parseInt(query.limit || '100', 10) || 100;
      const offset = parseInt(query.offset || '0', 10) || 0;

      let filtered = [...matchesIndex];

      if (season && season !== 'ALL') {
        filtered = filtered.filter(m => String(m.season) === String(season));
      }
      if (team && team !== 'ALL') {
        filtered = filtered.filter(m => (m.team1 === team || m.team2 === team));
      }
      if (venue && venue !== 'ALL') {
        filtered = filtered.filter(m => (m.venue || '').toLowerCase().includes(venue.toLowerCase()));
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(m =>
          (m.team1 || '').toLowerCase().includes(q) ||
          (m.team2 || '').toLowerCase().includes(q) ||
          (m.venue || '').toLowerCase().includes(q) ||
          (m.city || '').toLowerCase().includes(q) ||
          String(m.season || '').includes(q) ||
          ((m.playerOfMatch || m.player_of_match || '').toLowerCase().includes(q))
        );
      }

      // Reverse sort by date for latest first
      filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          total,
          matches: paginated,
          limit,
          offset
        })
      };
    }

    // 8. GET /api/replay/:match_id
    if (endpoint.startsWith('/replay/')) {
      const rawMatchId = endpoint.replace('/replay/', '').trim();
      let matchInfo = matchesIndex.find(m => (
        String(m.matchId) === rawMatchId || 
        String(m.match_id) === rawMatchId
      ));

      if (!matchInfo) {
        if (matchesIndex.length > 0) {
          matchInfo = matchesIndex[0];
        } else {
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: `Match ${rawMatchId} not found in IPL dataset` })
          };
        }
      }

      const replayPayload = generateMatchReplayData(matchInfo);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(replayPayload)
      };
    }

    // 9. POST /api/predict
    if (endpoint === '/predict') {
      if (method !== 'POST') {
        return {
          statusCode: 405,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
        };
      }

      const reqBody = event.body ? JSON.parse(event.body) : {};
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
      } = reqBody;

      if (!battingTeam || !bowlingTeam) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'battingTeam and bowlingTeam are required.' })
        };
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

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(prediction)
      };
    }

    // 10. POST /api/simulate
    if (endpoint === '/simulate') {
      if (method !== 'POST') {
        return {
          statusCode: 405,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
        };
      }

      const reqBody = event.body ? JSON.parse(event.body) : {};
      const { baseline, modified } = reqBody;

      if (!baseline || !modified) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Both baseline and modified scenario configurations are required.' })
        };
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

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          baseline: baselineResult,
          modified: modifiedResult,
          deltaProbability,
          narrative
        })
      };
    }

    // 11. GET /api/model-metrics & /api/model/metrics
    if (endpoint === '/model-metrics' || endpoint === '/model/metrics') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(modelArtifacts)
      };
    }

    // 12. GET /api/mystic-moments
    if (endpoint === '/mystic-moments') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(mysticMoments)
      };
    }

    // 13. GET /api/did-you-know
    if (endpoint === '/did-you-know') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(didYouKnow)
      };
    }

    // 14. GET /api/challenges & /api/analyst-challenges
    if (endpoint === '/challenges' || endpoint === '/analyst-challenges') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(analystChallenges)
      };
    }

    // 15. GET /api/mystic-challenges
    if (endpoint === '/mystic-challenges') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(mysticChallenges)
      };
    }

    // 16. GET /api/turning-points
    if (endpoint === '/turning-points') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({})
      };
    }

    // 17. GET /api/head-to-head
    if (endpoint === '/head-to-head') {
      const team1 = query.team1;
      const team2 = query.team2;

      if (!team1 || !team2) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'team1 and team2 are required parameters' })
        };
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

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
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
        })
      };
    }

    // 404 for unknown endpoints
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Endpoint not found: ${endpoint}`,
        availableEndpoints: [
          '/api/health',
          '/api/summary',
          '/api/teams',
          '/api/venues',
          '/api/seasons',
          '/api/players',
          '/api/matches',
          '/api/replay/:match_id',
          '/api/predict',
          '/api/simulate',
          '/api/model-metrics',
          '/api/mystic-moments',
          '/api/did-you-know',
          '/api/challenges',
          '/api/mystic-challenges',
          '/api/head-to-head'
        ]
      })
    };
  } catch (err: any) {
    console.error('Netlify function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal Server Error', message: err.message || 'Unknown error' })
    };
  }
};
