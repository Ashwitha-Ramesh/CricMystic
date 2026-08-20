import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  Flame, 
  Search, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { formatNumber, formatDecimal } from '../lib/formatters';
import { apiUrl } from '../lib/api';
import { TeamLogo } from './TeamLogo';
import { PlayerAvatar } from './PlayerAvatar';

interface ExploreIPLViewProps {
  initialSection?: 'teams' | 'seasons' | 'venues' | 'players' | 'moments';
  onReplayMatch?: (matchId: string) => void;
}

export const ExploreIPLView: React.FC<ExploreIPLViewProps> = ({
  initialSection = 'teams',
  onReplayMatch,
}) => {
  const [activeSection, setActiveSection] = useState<'teams' | 'seasons' | 'venues' | 'players' | 'moments'>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [batters, setBatters] = useState<any[]>([]);
  const [bowlers, setBowlers] = useState<any[]>([]);
  const [moments, setMoments] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [playerTab, setPlayerTab] = useState<'batters' | 'bowlers'>('batters');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(apiUrl('/api/teams')).then(r => r.json()),
      fetch(apiUrl('/api/seasons')).then(r => r.json()),
      fetch(apiUrl('/api/venues')).then(r => r.json()),
      fetch(apiUrl('/api/players')).then(r => r.json()),
      fetch(apiUrl('/api/mystic-moments')).then(r => r.json()),
    ])
      .then(([t, s, v, p, m]) => {
        setTeams(t || []);
        setSeasons(s || []);
        setVenues(v || []);
        setBatters(p?.topBatters || []);
        setBowlers(p?.topBowlers || []);
        setMoments(m || null);
      })
      .catch(err => console.error('Failed to load explore data', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered queries
  const filteredTeams = teams.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.code || t.shortName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVenues = venues.filter(v => 
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBatters = batters.filter(b => 
    (b.player || b.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBowlers = bowlers.filter(b => 
    (b.player || b.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore IPL Archives
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical intelligence spanning 19 seasons (2008–2026), 1,167 matches, and 278,000+ deliveries.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 flex-wrap">
          {[
            { id: 'teams', label: 'Teams', icon: Users },
            { id: 'seasons', label: 'Seasons', icon: Calendar },
            { id: 'venues', label: 'Venues', icon: MapPin },
            { id: 'players', label: 'Players', icon: Award },
            { id: 'moments', label: 'Mystic Moments', icon: Flame },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                id={`explore-tab-${tab.id}`}
                onClick={() => { setActiveSection(tab.id as any); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Filter Bar (for items with search) */}
      {(activeSection === 'teams' || activeSection === 'venues' || activeSection === 'players') && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeSection}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading archive dataset...</span>
        </div>
      ) : (
        <>
          {/* SECTION 1: TEAMS */}
          {activeSection === 'teams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredTeams.map((team) => {
                const winRate = team.stats.matches > 0 ? (team.stats.wins / team.stats.matches) * 100 : 0;
                return (
                  <div
                    key={team.name}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <TeamLogo team={team.name} size="md" />
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">{team.name}</h3>
                          <span className="text-xs font-mono font-bold text-slate-400">{team.code}</span>
                        </div>
                      </div>

                      {team.titles && team.titles.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[11px] font-bold shrink-0">
                          <span>🏆</span>
                          <span>{team.titles.length} Title{team.titles.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Matches</span>
                        <span className="text-sm font-bold font-mono text-white">{formatNumber(team.stats.matches)}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Wins</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">{formatNumber(team.stats.wins)}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Win Rate</span>
                        <span className="text-sm font-bold font-mono text-amber-400">{formatDecimal(winRate, 1)}%</span>
                      </div>
                    </div>

                    {team.titles && team.titles.length > 0 && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Champions in: <span className="text-slate-300 font-semibold">{team.titles.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 2: SEASONS JOURNEY */}
          {activeSection === 'seasons' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {seasons.map((season) => (
                <div
                  key={season.season}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <h3 className="text-lg font-black font-mono text-white">IPL {season.season}</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300">
                      {season.matches} Matches
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Total Runs</span>
                      <span className="text-sm font-bold font-mono text-white">{formatNumber(season.runs)}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Sixes</span>
                      <span className="text-sm font-bold font-mono text-red-400">{formatNumber(season.sixes)}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Wickets</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{formatNumber(season.wickets)}</span>
                    </div>
                  </div>

                  {season.highestScore && (
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Season Highest Total</span>
                        <span className="font-bold text-amber-400 font-mono">{season.highestScore.runs} Runs</span>
                        <span className="text-slate-300 block text-[11px]">({season.highestScore.team})</span>
                      </div>

                      {onReplayMatch && (
                        <button
                          onClick={() => onReplayMatch(season.highestScore.matchId)}
                          className="text-xs text-red-400 hover:underline flex items-center gap-1"
                        >
                          <span>Replay</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 3: VENUES */}
          {activeSection === 'venues' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredVenues.map((venue) => (
                <div
                  key={venue.name}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{venue.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{venue.matches} IPL Matches Hosted</span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        venue.chasingWinRate >= 50
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {venue.chasingWinRate >= 50 ? 'Chasing Favoured' : 'Defending Favoured'}
                    </span>
                  </div>

                  {/* Chasing vs Bat First Win split bar */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400">Chasing: {venue.chasingWins} ({formatDecimal(venue.chasingWinRate, 1)}%)</span>
                      <span className="text-blue-400">Bat 1st: {venue.batFirstWins}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${venue.chasingWinRate}%` }} />
                      <div className="bg-blue-500 h-full" style={{ width: `${100 - venue.chasingWinRate}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Avg 1st Innings Score:</span>
                    <span className="text-amber-400 font-bold text-sm">{formatNumber(venue.avg1stInningsScore)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: PLAYERS */}
          {activeSection === 'players' && (
            <div className="space-y-6 animate-fade-in">
              {/* Batters vs Bowlers toggle */}
              <div className="flex items-center gap-2">
                <button
                  id="player-tab-batters"
                  onClick={() => setPlayerTab('batters')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    playerTab === 'batters'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Top IPL Run Scorers (All-Time)
                </button>
                <button
                  id="player-tab-bowlers"
                  onClick={() => setPlayerTab('bowlers')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    playerTab === 'bowlers'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Top IPL Wicket Takers (All-Time)
                </button>
              </div>

              {playerTab === 'batters' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBatters.map((p, idx) => (
                    <div
                      key={p.player}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar name={p.player} team={p.team || ''} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-amber-400">#{idx + 1}</span>
                              <h3 className="text-sm font-bold text-white truncate max-w-[140px]">{p.player}</h3>
                            </div>
                            {p.team && <span className="text-[11px] text-slate-400 block truncate">{p.team}</span>}
                          </div>
                        </div>
                        <span className="text-lg font-black font-mono text-amber-400">
                          {formatNumber(p.runs)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Strike Rate</span>
                          <span className="font-mono font-bold text-emerald-400">{formatDecimal(p.strikeRate, 2)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Average</span>
                          <span className="font-mono font-bold text-blue-400">{formatDecimal(p.average, 2)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">6s / 4s</span>
                          <span className="font-mono font-bold text-slate-200">{formatNumber(p.sixes)} / {formatNumber(p.fours)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBowlers.map((b, idx) => (
                    <div
                      key={b.player}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar name={b.player} team={b.team || ''} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-emerald-400">#{idx + 1}</span>
                              <h3 className="text-sm font-bold text-white truncate max-w-[140px]">{b.player}</h3>
                            </div>
                            {b.team && <span className="text-[11px] text-slate-400 block truncate">{b.team}</span>}
                          </div>
                        </div>
                        <span className="text-lg font-black font-mono text-emerald-400">
                          {formatNumber(b.wickets)} Wkts
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Economy</span>
                          <span className="font-mono font-bold text-amber-400">{formatDecimal(b.economy, 2)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Average</span>
                          <span className="font-mono font-bold text-blue-400">{formatDecimal(b.average, 2)}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Strike Rate</span>
                          <span className="font-mono font-bold text-slate-200">{formatDecimal(b.strikeRate, 2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: MYSTIC MOMENTS */}
          {activeSection === 'moments' && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold text-white">Iconic Mystic Moments in IPL History</h3>
                </div>

                {(() => {
                  const momentsList: any[] = Array.isArray(moments) 
                    ? moments 
                    : (moments?.biggestChases || moments?.moments || []);

                  if (momentsList.length === 0) {
                    return (
                      <p className="text-sm text-slate-400 py-6">
                        No moments loaded yet.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {momentsList.map((m: any, idx: number) => {
                        const teams = Array.isArray(m.teams) ? m.teams : [m.chasingTeam || 'Team 1', m.opposingTeam || 'Team 2'];
                        const matchId = m.matchId || m.match_id;

                        return (
                          <div
                            key={m.id || idx}
                            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center -space-x-1.5 mr-1">
                                    <TeamLogo team={teams[0]} size="xs" />
                                    <TeamLogo team={teams[1]} size="xs" />
                                  </div>
                                  <span className="font-bold text-white text-sm">{teams[0]}</span>
                                  <span className="text-xs font-mono text-slate-400">vs</span>
                                  <span className="font-bold text-slate-300 text-sm">{teams[1]}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                    {m.season}
                                  </span>
                                  {m.tag && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono">
                                      {m.tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <h4 className="text-xs font-semibold text-amber-400">
                                {m.title || m.summary}
                              </h4>
                              <p className="text-xs text-slate-400">
                                {m.summary || `${m.winner} won by ${m.margin}`}
                              </p>
                            </div>

                            {onReplayMatch && matchId && (
                              <button
                                onClick={() => onReplayMatch(matchId)}
                                className="self-end px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                              >
                                <span>Replay Match</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
