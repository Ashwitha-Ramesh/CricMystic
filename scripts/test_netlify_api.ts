import { handler } from '../netlify/functions/api';

async function runTests() {
  console.log('--- Testing Netlify Serverless API Handler ---');

  const testEndpoints = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/summary' },
    { method: 'GET', path: '/api/teams' },
    { method: 'GET', path: '/api/venues' },
    { method: 'GET', path: '/api/seasons' },
    { method: 'GET', path: '/api/players' },
    { method: 'GET', path: '/api/matches', query: { limit: '5', season: '2026' } },
    { method: 'GET', path: '/api/replay/1535465' },
    { method: 'GET', path: '/api/model-metrics' },
    { method: 'GET', path: '/api/mystic-moments' },
    { method: 'GET', path: '/api/did-you-know' },
    { method: 'GET', path: '/api/challenges' },
    { method: 'GET', path: '/api/mystic-challenges' },
    { method: 'GET', path: '/api/head-to-head', query: { team1: 'Royal Challengers Bengaluru', team2: 'Chennai Super Kings' } },
    {
      method: 'POST',
      path: '/api/predict',
      body: JSON.stringify({
        battingTeam: 'Royal Challengers Bengaluru',
        bowlingTeam: 'Gujarat Titans',
        venue: 'Narendra Modi Stadium, Ahmedabad',
        innings: 2,
        currentScore: 120,
        wicketsLost: 3,
        overs: 14.2,
        target: 156
      })
    },
    {
      method: 'POST',
      path: '/api/simulate',
      body: JSON.stringify({
        baseline: {
          battingTeam: 'Royal Challengers Bengaluru',
          bowlingTeam: 'Chennai Super Kings',
          currentScore: 120,
          wicketsLost: 3,
          overs: 14.0,
          target: 180
        },
        modified: {
          battingTeam: 'Royal Challengers Bengaluru',
          bowlingTeam: 'Chennai Super Kings',
          currentScore: 135,
          wicketsLost: 2,
          overs: 14.0,
          target: 180
        }
      })
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of testEndpoints) {
    try {
      const res = await handler({
        path: t.path,
        httpMethod: t.method,
        headers: {},
        queryStringParameters: t.query || null,
        body: t.body || null
      });

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(res.body);
        console.log(`[✓ PASS] ${t.method} ${t.path} -> HTTP ${res.statusCode} (${Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed})`);
        passed++;
      } else {
        console.error(`[✗ FAIL] ${t.method} ${t.path} -> HTTP ${res.statusCode}:`, res.body);
        failed++;
      }
    } catch (e) {
      console.error(`[✗ ERROR] ${t.method} ${t.path}:`, e);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
