export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number;
  genre: string;
}

const catalog: Track[] = [
  { id: 't1', title: 'Midnight Systems', artist: 'Rave Culture', bpm: 138, key: 'Amin', energy: 0.9, genre: 'Techno' },
  { id: 't2', title: 'Neural Pathways', artist: 'Base FM', bpm: 140, key: 'Bm', energy: 0.85, genre: 'Techno' },
  { id: 't3', title: 'Crypto Hearts', artist: 'Onchain', bpm: 128, key: 'Cmaj', energy: 0.75, genre: 'House' },
  { id: 't4', title: 'Factory Floor', artist: 'Industrial Mind', bpm: 145, key: 'Fm', energy: 0.95, genre: 'Industrial' },
  { id: 't5', title: 'Analog Dreams', artist: 'Synth Wizard', bpm: 132, key: 'Emaj', energy: 0.7, genre: 'Synthwave' },
  { id: 't6', title: 'Sub Bass Alert', artist: 'Low End', bpm: 142, key: 'Gm', energy: 0.95, genre: 'Drum & Bass' },
  { id: 't7', title: 'Ambient Section', artist: 'Space Music', bpm: 80, key: 'Cmaj', energy: 0.2, genre: 'Ambient' },
  { id: 't8', title: 'Warehouse Rave', artist: 'Old School', bpm: 136, key: 'Am', energy: 0.88, genre: 'Techno' },
  { id: 't9', title: 'Sunrise Groove', artist: 'Morning Crew', bpm: 124, key: 'Dmaj', energy: 0.6, genre: 'House' },
  { id: 't10', title: 'Peak Time Killer', artist: 'Headliner', bpm: 145, key: 'Gm', energy: 1.0, genre: 'Techno' },
];

const camelotWheel: Record<string, string[]> = {
  'Cmaj': ['Cmaj', 'Am'],
  'Fmaj': ['Fmaj', 'Dm'],
  'Dm': ['Dm', 'Fmaj'],
  'Bm': ['Bm', 'Gmaj'],
  'Gmaj': ['Gmaj', 'Bm'],
  'Emaj': ['Emaj', 'Cmaj'],
  'Cm': ['Cm', 'Gm'],
  'Gm': ['Gm', 'Cm'],
  'Fm': ['Fm', 'Bm'],
  'Dmaj': ['Dmaj', 'Bm'],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'build',
      startBpm,
      endBpm,
      startEnergy,
      endEnergy,
      duration,
      genre,
      tracks = [] 
    } = body;

    if (action === 'build') {
      const targetDuration = duration || 60;
      const tracksPerMinute = 1.5;
      const trackCount = Math.ceil(targetDuration / tracksPerMinute);
      
      let selected: Track[] = [...catalog];
      
      if (genre) {
        selected = selected.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
      }

      const energyCurve = generateEnergyCurve(startEnergy || 0.5, endEnergy || 0.9, trackCount);
      
      selected = selected.sort((a, b) => {
        const energyMatchA = Math.abs(a.energy - energyCurve[0]);
        const energyMatchB = Math.abs(b.energy - energyCurve[0]);
        return energyMatchA - energyMatchB;
      });

      const setlist: Track[] = [];
      let currentBpm = startBpm || 128;
      let lastKey = 'Cmaj';
      let currentEnergy = startEnergy || 0.5;

      for (let i = 0; i < Math.min(trackCount, selected.length); i++) {
        const track = selected[i];
        
        const bpmJump = Math.abs(track.bpm - currentBpm);
        if (bpmJump > 10 && i > 0) continue;
        
        const compatibleKeys = camelotWheel[lastKey] || [lastKey];
        const keyCompatible = compatibleKeys.some(k => k.toLowerCase() === track.key.toLowerCase());
        if (!keyCompatible && i > 0 && Math.random() > 0.5) continue;

        setlist.push(track);
        currentBpm = track.bpm;
        lastKey = track.key;
        currentEnergy = track.energy;
      }

      const totalDuration = setlist.length * tracksPerMinute;
      const avgEnergy = setlist.reduce((sum, t) => sum + t.energy, 0) / setlist.length;

      return NextResponse.json({
        success: true,
        setlist: setlist.map((t, i) => ({
          ...t,
          position: i + 1,
          energy: energyCurve[i] || avgEnergy,
          camelotKey: t.key,
          harmonicKey: camelotWheel[t.key]?.[0] || t.key
        })),
        stats: {
          totalTracks: setlist.length,
          duration: Math.round(totalDuration),
          avgBpm: Math.round(setlist.reduce((s, t) => s + t.bpm, 0) / setlist.length),
          avgEnergy: Math.round(avgEnergy * 100) / 100,
          energyCurve: energyCurve.slice(0, setlist.length)
        }
      });
    }

    if (action === 'analyze') {
      if (!tracks || !Array.isArray(tracks)) {
        return NextResponse.json({ error: 'Tracks array required' }, { status: 400 });
      }

      const fullTracks = tracks
        .map((id: string) => catalog.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
      
      if (fullTracks.length === 0) {
        return NextResponse.json({ error: 'No valid tracks found' }, { status: 400 });
      }
      
      const analysis = {
        bpmRange: {
          min: Math.min(...fullTracks.map(t => t.bpm)),
          max: Math.max(...fullTracks.map(t => t.bpm)),
          spread: Math.max(...fullTracks.map(t => t.bpm)) - Math.min(...fullTracks.map(t => t.bpm))
        },
        energyRange: {
          min: Math.min(...fullTracks.map(t => t.energy)),
          max: Math.max(...fullTracks.map(t => t.energy)),
          flow: calculateEnergyFlow(fullTracks)
        },
        keyAnalysis: analyzeHarmonicMix(fullTracks),
        genreBreakdown: getGenreBreakdown(fullTracks),
        flowScore: calculateFlowScore(fullTracks)
      };

      return NextResponse.json({
        success: true,
        analysis
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Setlist Oracle error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function generateEnergyCurve(start: number, end: number, steps: number): number[] {
  const curve = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / Math.max(steps - 1, 1);
    const energy = start + (end - start) * Math.pow(progress, 0.8);
    curve.push(Math.min(1, Math.max(0, energy)));
  }
  return curve;
}

function calculateEnergyFlow(tracks: Track[]): string {
  let increases = 0;
  let decreases = 0;
  
  for (let i = 1; i < tracks.length; i++) {
    if (tracks[i].energy > tracks[i-1].energy) increases++;
    else decreases++;
  }
  
  if (increases > decreases * 2) return 'Building';
  if (decreases > increases * 2) return 'Cooling down';
  return 'Dynamic';
}

function analyzeHarmonicMix(tracks: Track[]): { compatible: number, incompatible: number, score: number } {
  let compatible = 0;
  let incompatible = 0;
  
  for (let i = 1; i < tracks.length; i++) {
    const current = tracks[i].key;
    const previous = tracks[i-1].key;
    const compatibleKeys = camelotWheel[previous] || [];
    
    if (compatibleKeys.some(k => k.toLowerCase() === current.toLowerCase())) {
      compatible++;
    } else {
      incompatible++;
    }
  }
  
  const total = compatible + incompatible;
  return {
    compatible,
    incompatible,
    score: total > 0 ? Math.round((compatible / total) * 100) : 100
  };
}

function getGenreBreakdown(tracks: Track[]): Record<string, number> {
  return tracks.reduce((acc, t) => {
    acc[t.genre] = (acc[t.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateFlowScore(tracks: Track[]): number {
  let score = 50;
  
  const bpmChanges = tracks.slice(1).map((t, i) => Math.abs(t.bpm - tracks[i].bpm));
  const avgBpmChange = bpmChanges.reduce((s, c) => s + c, 0) / bpmChanges.length;
  score += Math.max(0, 25 - avgBpmChange);
  
  const harmonic = analyzeHarmonicMix(tracks);
  score += harmonic.score / 4;
  
  return Math.min(100, Math.round(score));
}

export async function GET() {
  return NextResponse.json({
    skill: 'setlist-oracle',
    name: 'Setlist Oracle',
    description: 'Analyze BPM, key, and energy curves to build perfect DJ sets',
    security: {
      readOnly: true,
      noUserData: true,
      mockDataOnly: true,
      noExternalCalls: true
    },
    actions: {
      build: 'Generate a setlist based on parameters',
      analyze: 'Analyze an existing setlist'
    },
    parameters: {
      action: 'build | analyze',
      startBpm: 'optional - starting BPM',
      endBpm: 'optional - ending BPM', 
      startEnergy: 'optional - 0-1 starting energy',
      endEnergy: 'optional - 0-1 ending energy',
      duration: 'optional - set length in minutes',
      genre: 'optional - primary genre',
      tracks: 'optional - array of track IDs for analyze'
    },
    features: [
      'Camelot wheel harmonic mixing',
      'Energy curve optimization',
      'BPM spread analysis',
      'Genre blending recommendations'
    ]
  });
}
