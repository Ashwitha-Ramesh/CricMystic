export interface MatchSummary {
  match_id: string;
  season: string;
  date: string;
  team1: string;
  team2: string;
  venue: string;
  city: string;
  winner: string;
  win_type: 'runs' | 'wickets' | 'tie_super_over' | 'no_result' | 'abandoned';
  win_margin: number;
  innings1_runs: number;
  innings1_wickets: number;
  innings1_overs: string;
  innings2_runs: number;
  innings2_wickets: number;
  innings2_overs: string;
  target_runs?: number;
  player_of_match: string;
  is_completed: boolean;
  has_turning_points: boolean;
}

export interface Delivery {
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

export interface TurningPointEvent {
  over: number;
  ball: number;
  delivery: string;
  swing: number;
  desc: string;
  probBefore: number;
  probAfter: number;
}

export interface MatchTurningPoints {
  maxSwing: TurningPointEvent;
  topSwings: TurningPointEvent[];
  biggestWicket?: { over: number; ball: number; player: string; bowler: string; swing: number } | null;
  biggestBoundary?: { over: number; ball: number; striker: string; runs: number; swing: number } | null;
}

export interface PredictionResult {
  battingTeam: string;
  bowlingTeam: string;
  battingProbability: number;
  bowlingProbability: number;
  meterState: 'Very unlikely' | 'Against the odds' | 'Too close to call' | 'Favourites' | 'Strongly favoured';
  meterDescription: string;
  calculatedMetrics: {
    ballsRemaining: number;
    runsRequired: number;
    currentRunRate: number;
    requiredRunRate: number;
    rrrCrrDifference: number;
    wicketsRemaining: number;
    chaseProgressPercent: number;
  };
  whyBattingFavoured: string[];
  whyBowlingCanTurn: string[];
  contributions: {
    feature: string;
    label: string;
    contribution: number;
    impact: 'favours_batting' | 'favours_bowling';
    explanation: string;
  }[];
}

export interface SimulationResult {
  baseline: PredictionResult;
  modified: PredictionResult;
  deltaProbability: number;
  narrative: string;
}

export interface TeamData {
  name: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  founded: number;
  active: boolean;
  titles: number[];
  stats: {
    matches: number;
    wins: number;
    losses: number;
    runsScored: number;
    ballsFaced: number;
    runsConceded: number;
    ballsBowled: number;
  };
}

export interface VenueData {
  name: string;
  matches: number;
  chasingWins: number;
  batFirstWins: number;
  ties: number;
  chasingWinRate: number;
  avg1stInningsScore: number;
}

export interface SeasonData {
  season: string;
  matches: number;
  completed: number;
  runs: number;
  wickets: number;
  balls: number;
  sixes: number;
  fours: number;
  highestScore: {
    runs: number;
    team: string;
    matchId: string;
  };
}

export interface PlayerBatter {
  player: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissals: number;
  matches: number;
  strikeRate: number;
  average: number;
  highScore: number;
}

export interface PlayerBowler {
  player: string;
  wickets: number;
  balls: number;
  runs: number;
  dots: number;
  matches: number;
  economy: number;
  average: number;
  strikeRate: number;
  bestBowling: string;
}

export interface AnalystChallenge {
  id: string;
  matchId?: string;
  title: string;
  season: string;
  venue: string;
  battingTeam: string;
  bowlingTeam: string;
  situation: string;
  overs: string;
  score: string;
  target: number;
  runsNeeded: number;
  ballsRemaining: number;
  crr: string;
  rrr: string;
  cricMysticProbBatting: number;
  cricMysticProbBowling: number;
  actualWinner: string;
  explanation: string;
}

export interface MysticChallenge {
  id: string;
  matchTitle: string;
  over: string;
  situation: string;
  options: string[];
  correctAnswer: string;
  actualOutcome: string;
  swing: string;
}

export interface ModelMetricsData {
  modelName: string;
  trainingPeriod: string;
  validationPeriod: string;
  testPeriod: string;
  numTrainingStates: number;
  numValidationStates: number;
  numTestStates: number;
  bias: number;
  weights: number[];
  featureKeys: string[];
  featureImportances: {
    feature: string;
    label: string;
    weight: number;
    absImportance: number;
    direction: string;
  }[];
  trainMetrics: {
    logLoss: number;
    brierScore: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    rocAuc: number;
    confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
    calibrationBins: { bin: string; min: number; max: number; count: number; meanPred: number; actualFraction: number }[];
  };
  valMetrics: {
    logLoss: number;
    brierScore: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    rocAuc: number;
    confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
    calibrationBins: { bin: string; min: number; max: number; count: number; meanPred: number; actualFraction: number }[];
  };
  testMetrics: {
    logLoss: number;
    brierScore: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    rocAuc: number;
    confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
    calibrationBins: { bin: string; min: number; max: number; count: number; meanPred: number; actualFraction: number }[];
  };
  modelComparison: {
    model: string;
    logLoss: number;
    brier: number;
    rocAuc: number;
    accuracy: number;
  }[];
}
