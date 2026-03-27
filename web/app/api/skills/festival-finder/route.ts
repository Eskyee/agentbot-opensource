import { NextRequest, NextResponse } from 'next/server';

interface Festival {
  id: string;
  name: string;
  city: string;
  country: string;
  dates: string;
  genre: string[];
  capacity: number;
  price: number;
  stageCount: number;
}

const festivals: Festival[] = [
  { id: 'f1', name: 'Awakenings', city: 'Amsterdam', country: 'Netherlands', dates: 'June 20-22, 2026', genre: ['techno', 'house'], capacity: 75000, price: 350, stageCount: 8 },
  { id: 'f2', name: 'Glastonbury', city: 'Somerset', country: 'UK', dates: 'June 25-29, 2026', genre: ['electronic', 'rock', 'dance'], capacity: 200000, price: 450, stageCount: 25 },
  { id: 'f3', name: 'Printworks London', city: 'London', country: 'UK', dates: 'Multiple dates', genre: ['techno', 'house', 'dnb'], capacity: 5000, price: 85, stageCount: 3 },
  { id: 'f4', name: 'Dekmantel', city: 'Amsterdam', country: 'Netherlands', dates: 'July 30 - Aug 3, 2026', genre: ['techno', 'house'], capacity: 35000, price: 280, stageCount: 6 },
  { id: 'f5', name: 'Creamfields', city: 'Daresbury', country: 'UK', dates: 'Aug 27-30, 2026', genre: ['edm', 'trance', 'house'], capacity: 70000, price: 320, stageCount: 8 },
  { id: 'f6', name: 'Son Barcelona', city: 'Barcelona', country: 'Spain', dates: 'June 12-14, 2026', genre: ['techno', 'house'], capacity: 45000, price: 290, stageCount: 5 },
  { id: 'f7', name: 'Station Warehouse', city: 'Birmingham', country: 'UK', dates: 'Every weekend', genre: ['techno', 'hardcore'], capacity: 2000, price: 25, stageCount: 2 },
  { id: 'f8', name: ' fabric presents', city: 'London', country: 'UK', dates: 'Ongoing', genre: ['techno', 'house'], capacity: 1600, price: 35, stageCount: 3 },
  { id: 'f9', name: 'Hï Ibiza', city: 'Ibiza', country: 'Spain', dates: 'May-Oct 2026', genre: ['house', 'techno'], capacity: 4000, price: 80, stageCount: 4 },
  { id: 'f10', name: 'Ultra Miami', city: 'Miami', country: 'USA', dates: 'March 20-22, 2026', genre: ['edm', 'house', 'techno'], capacity: 170000, price: 550, stageCount: 8 },
  { id: 'f11', name: 'Tomorrowland', city: 'Boom', country: 'Belgium', dates: 'July 17-27, 2026', genre: ['edm', 'house'], capacity: 400000, price: 450, stageCount: 18 },
  { id: 'f12', name: 'We Are FSTVL', city: 'London', country: 'UK', dates: 'May 30 - June 1, 2026', genre: ['house', 'techno', 'dnb'], capacity: 30000, price: 200, stageCount: 6 },
];

const VALID_GENRES = ['techno', 'house', 'edm', 'trance', 'dnb', 'hardcore', 'rock', 'dance', 'electronic'];
const VALID_COUNTRIES = ['UK', 'Netherlands', 'Spain', 'Belgium', 'USA', 'Germany', 'France', 'Italy'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const VALID_ACTIONS = ['search', 'detail', 'lineup', 'compare', 'recommend'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'search') {
      let results = [...festivals];

      if (data.genre && VALID_GENRES.includes(data.genre)) {
        results = results.filter(f => f.genre.includes(data.genre));
      }

      if (data.country && VALID_COUNTRIES.includes(data.country)) {
        results = results.filter(f => f.country === data.country);
      }

      if (data.city) {
        results = results.filter(f => f.city.toLowerCase().includes(data.city.toLowerCase()));
      }

      if (data.maxPrice) {
        results = results.filter(f => f.price <= Number(data.maxPrice));
      }

      if (data.maxCapacity) {
        results = results.filter(f => f.capacity <= Number(data.maxCapacity));
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        festivals: results.map(f => ({
          id: f.id,
          name: f.name,
          city: f.city,
          country: f.country,
          dates: f.dates,
          genre: f.genre.join(', '),
          price: f.price
        }))
      });
    }

    if (action === 'detail') {
      if (!data.festivalId) {
        return NextResponse.json({ error: 'festivalId required' }, { status: 400 });
      }

      const festival = festivals.find(f => f.id === data.festivalId);
      if (!festival) {
        return NextResponse.json({ error: 'Festival not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, festival });
    }

    if (action === 'lineup') {
      if (!data.festivalId) {
        return NextResponse.json({ error: 'festivalId required' }, { status: 400 });
      }

      const festival = festivals.find(f => f.id === data.festivalId);
      if (!festival) {
        return NextResponse.json({ error: 'Festival not found' }, { status: 404 });
      }

      const mockLineup = [
        'Carl Cox', 'Peggy Gou', 'Fred again..', 'Four Tet', 'Richie Hawtin',
        'Amelie Lens', 'Charlotte de Witte', 'Adam Beyer', 'Nina Kraviz', 'Skrillex'
      ];

      return NextResponse.json({
        success: true,
        festival: festival.name,
        lineup: mockLineup.slice(0, Math.floor(Math.random() * 6) + 4)
      });
    }

    if (action === 'compare') {
      if (!data.festivalIds || !Array.isArray(data.festivalIds)) {
        return NextResponse.json({ error: 'festivalIds array required' }, { status: 400 });
      }

      const selected = festivals.filter(f => data.festivalIds.includes(f.id));
      if (selected.length < 2) {
        return NextResponse.json({ error: 'Need at least 2 festivals to compare' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        comparison: selected.map(f => ({
          name: f.name,
          city: f.city,
          price: f.price,
          capacity: f.capacity,
          stages: f.stageCount
        }))
      });
    }

    if (action === 'recommend') {
      const budget = Number(data.budget) || 300;
      const preferredGenre = data.genre || 'techno';
      const ukPreferred = data.ukOnly === true;

      let results = festivals.filter(f => 
        f.price <= budget && 
        f.genre.includes(preferredGenre)
      );

      if (ukPreferred) {
        results = results.filter(f => f.country === 'UK');
      }

      results.sort((a, b) => b.capacity - a.capacity);

      return NextResponse.json({
        success: true,
        recommendations: results.slice(0, 3).map(f => ({
          id: f.id,
          name: f.name,
          city: f.city,
          country: f.country,
          price: f.price,
          matchScore: Math.floor(Math.random() * 20) + 80
        }))
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Festival Finder error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'festival-finder',
    name: 'Festival Finder',
    description: 'Discover festivals worldwide, compare lineups, get recommendations',
    security: { readOnly: true, mockData: true },
    actions: {
      search: 'Search by genre, country, city, price, capacity',
      detail: 'Get festival details',
      lineup: 'Get mock lineup for festival',
      compare: 'Compare 2+ festivals',
      recommend: 'Get personalized recommendations'
    },
    filters: {
      genre: VALID_GENRES,
      country: VALID_COUNTRIES
    }
  });
}
