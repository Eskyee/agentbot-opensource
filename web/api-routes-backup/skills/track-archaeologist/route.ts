export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  mood: string[];
  releaseDate: string;
  audioFeatures: {
    energy: number;
    danceability: number;
    darkness: number;
  };
}

const mockCatalog: Track[] = [
  { id: 't1', title: 'Midnight Systems', artist: 'Rave Culture', bpm: 138, key: 'Amin', genre: 'Techno', mood: ['dark', 'industrial'], releaseDate: '2025-12-01', audioFeatures: { energy: 0.9, danceability: 0.7, darkness: 0.95 } },
  { id: 't2', title: 'Neural Pathways', artist: 'Base FM', bpm: 140, key: 'Bm', genre: 'Techno', mood: ['dark', 'hypnotic'], releaseDate: '2025-11-15', audioFeatures: { energy: 0.85, danceability: 0.65, darkness: 0.9 } },
  { id: 't3', title: 'Crypto Hearts', artist: 'Onchain', bpm: 128, key: 'Cmaj', genre: 'House', mood: ['uplifting', 'melodic'], releaseDate: '2025-10-20', audioFeatures: { energy: 0.75, danceability: 0.9, darkness: 0.3 } },
  { id: 't4', title: 'Factory Floor', artist: 'Industrial Mind', bpm: 145, key: 'Fm', genre: 'Industrial', mood: ['dark', 'aggressive'], releaseDate: '2025-09-10', audioFeatures: { energy: 0.95, danceability: 0.5, darkness: 0.98 } },
  { id: 't5', title: 'Analog Dreams', artist: 'Synth Wizard', bpm: 132, key: 'Emaj', genre: 'Synthwave', mood: ['nostalgic', 'retro'], releaseDate: '2025-08-25', audioFeatures: { energy: 0.7, danceability: 0.6, darkness: 0.4 } },
  { id: 't6', title: 'Sub Bass Alert', artist: 'Low End', bpm: 142, key: 'Gm', genre: 'Drum & Bass', mood: ['dark', 'energetic'], releaseDate: '2025-07-30', audioFeatures: { energy: 0.95, danceability: 0.85, darkness: 0.7 } },
  { id: 't7', title: 'Ambient Section', artist: 'Space Music', bpm: 80, key: 'Cmaj', genre: 'Ambient', mood: ['calm', 'spacey'], releaseDate: '2025-06-15', audioFeatures: { energy: 0.2, danceability: 0.3, darkness: 0.2 } },
  { id: 't8', title: 'Warehouse Rave', artist: 'Old School', bpm: 136, key: 'Am', genre: 'Techno', mood: ['dark', 'warehouse'], releaseDate: '2025-05-01', audioFeatures: { energy: 0.88, danceability: 0.75, darkness: 0.85 } },
];

function calculateSimilarity(track1: Track, track2: Track): number {
  let score = 0;
  
  const bpmDiff = Math.abs(track1.bpm - track2.bpm);
  score += Math.max(0, 1 - bpmDiff / 50) * 25;
  
  const energyDiff = Math.abs(track1.audioFeatures.energy - track2.audioFeatures.energy);
  score += (1 - energyDiff) * 25;
  
  const darknessDiff = Math.abs(track1.audioFeatures.darkness - track2.audioFeatures.darkness);
  score += (1 - darknessDiff) * 25;
  
  const moodOverlap = track1.mood.filter(m => track2.mood.includes(m)).length;
  score += (moodOverlap / Math.max(track1.mood.length, track2.mood.length)) * 25;
  
  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'search',
      trackId,
      bpm,
      key,
      genre,
      mood,
      energy,
      limit = 10 
    } = body;

    if (action === 'search') {
      let results = [...mockCatalog];

      if (bpm) {
        results = results.filter(t => Math.abs(t.bpm - bpm) <= 10);
      }

      if (key) {
        results = results.filter(t => t.key.toLowerCase() === key.toLowerCase());
      }

      if (genre) {
        results = results.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
      }

      if (mood && Array.isArray(mood)) {
        results = results.filter(t => 
          mood.some(m => t.mood.map(x => x.toLowerCase()).includes(m.toLowerCase()))
        );
      }

      if (energy !== undefined) {
        results = results.filter(t => 
          Math.abs(t.audioFeatures.energy - energy) <= 0.2
        );
      }

      if (trackId) {
        const sourceTrack = mockCatalog.find(t => t.id === trackId);
        if (sourceTrack) {
          results = results
            .filter(t => t.id !== trackId)
            .map(t => ({
              ...t,
              similarity: calculateSimilarity(sourceTrack, t)
            }))
            .sort((a, b) => b.similarity - a.similarity);
        }
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        tracks: results.slice(0, limit)
      });
    }

    if (action === 'analyze') {
      const track = mockCatalog.find(t => t.id === trackId);
      if (!track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      const similar = mockCatalog
        .filter(t => t.id !== trackId)
        .map(t => ({ ...t, similarity: calculateSimilarity(track, t) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return NextResponse.json({
        success: true,
        track,
        analysis: {
          energy: track.audioFeatures.energy > 0.7 ? 'High energy' : 'Low energy',
          darkness: track.audioFeatures.darkness > 0.7 ? 'Dark' : 'Light',
          danceability: track.audioFeatures.danceability > 0.7 ? 'Highly danceable' : 'Less danceable',
          bestFor: track.audioFeatures.energy > 0.8 ? 'Peak time' : 'Warmup/Cooldown'
        },
        similarTracks: similar,
        tags: [...track.mood, track.genre.toLowerCase()]
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Track Archaeologist error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'track-archaeologist',
    name: 'Track Archaeologist',
    description: 'Deep catalog digging via BlockDB similarity search',
    security: {
      readOnly: true,
      noUserData: true,
      mockDataOnly: true,
      noExternalCalls: true
    },
    actions: {
      search: 'Find tracks by criteria',
      analyze: 'Analyze a track and find similar ones'
    },
    parameters: {
      action: 'search | analyze',
      trackId: 'optional - track ID for similarity',
      bpm: 'optional - BPM to match',
      key: 'optional - musical key',
      genre: 'optional - genre filter',
      mood: 'optional - array of moods',
      energy: 'optional - 0-1 energy level',
      limit: 'optional - max results (default 10)'
    },
    mockData: `${mockCatalog.length} tracks available for demo`
  });
}
