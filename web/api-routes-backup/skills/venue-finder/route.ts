export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

interface Venue {
  id: string;
  name: string;
  city: string;
  type: string;
  capacity: number;
  price: number;
  amenities: string[];
  contact: string;
}

const venues: Venue[] = [
  // UK Venues
  { id: 'v1', name: 'The Basement', city: 'London', type: 'underground', capacity: 200, price: 300, amenities: ['sound-system', 'bar', 'locker'], contact: '@basement_london' },
  { id: 'v7', name: 'Printworks', city: 'London', type: 'warehouse', capacity: 5000, price: 5000, amenities: ['stage', 'bar', 'vip', 'parking'], contact: 'book@printworks.london' },
  { id: 'v8', name: 'Studio 338', city: 'London', type: 'club', capacity: 800, price: 1200, amenities: ['sound-system', 'vip', 'booth', 'terrace'], contact: 'info@studio338.co.uk' },
  { id: 'v9', name: 'The Warehouse Project', city: 'Manchester', type: 'warehouse', capacity: 2500, price: 3000, amenities: ['stage', 'bar', 'vip'], contact: 'booking@thewarehouseproject.com' },
  { id: 'v10', name: 'Cabaret Voltaire', city: 'Edinburgh', type: 'underground', capacity: 150, price: 200, amenities: ['sound-system', 'bar'], contact: '@cabvol' },
  // Europe
  { id: 'v2', name: 'Warehouse 42', city: 'Berlin', type: 'warehouse', capacity: 500, price: 800, amenities: ['stage', 'bar', 'vip', 'parking'], contact: 'booking@warehouse42.de' },
  { id: 'v11', name: 'Berghain', city: 'Berlin', type: 'club', capacity: 1500, price: 1500, amenities: ['sound-system', 'vip'], contact: 'info@berghain.de' },
  { id: 'v12', name: 'Fabric', city: 'London', type: 'club', capacity: 1600, price: 2000, amenities: ['sound-system', 'bar', 'vip'], contact: 'hire@fabriclondon.com' },
  { id: 'v13', name: 'Dee Dee', city: 'Amsterdam', type: 'club', capacity: 400, price: 600, amenities: ['sound-system', 'bar'], contact: 'book@deedeebar.nl' },
  { id: 'v14', name: 'Concrete', city: 'Paris', type: 'underground', capacity: 600, price: 900, amenities: ['sound-system', 'bar'], contact: 'booking@concrete.fr' },
  // Global
  { id: 'v3', name: 'Rooftop花园', city: 'Shanghai', type: 'rooftop', capacity: 150, price: 600, amenities: ['view', 'bar', 'catering'], contact: 'events@rooftop-sh.com' },
  { id: 'v4', name: 'Club Terminal', city: 'Tokyo', type: 'club', capacity: 300, price: 500, amenities: ['sound-system', 'vip', 'booth'], contact: 'info@terminal.tokyo' },
  { id: 'v5', name: 'The Garden', city: 'Los Angeles', type: 'outdoor', capacity: 400, price: 1200, amenities: ['stage', 'bar', 'parking', 'catering'], contact: 'book@thegarden.la' },
  { id: 'v6', name: 'Sub basement', city: 'Detroit', type: 'underground', capacity: 100, price: 150, amenities: ['sound-system'], contact: '@detroit_techno' },
  { id: 'v15', name: 'Hören', city: 'Berlin', type: 'underground', capacity: 80, price: 150, amenities: ['sound-system'], contact: '@hoeren.berlin' },
  { id: 'v16', name: 'Club Toon', city: 'Seoul', type: 'club', capacity: 500, price: 700, amenities: ['sound-system', 'vip'], contact: 'info@clubtoon.kr' },
];

const VALID_TYPES = ['underground', 'warehouse', 'club', 'rooftop', 'outdoor', 'festival'];
const VALID_AMENTIES = ['sound-system', 'bar', 'vip', 'stage', 'parking', 'catering', 'locker', 'booth', 'view'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const VALID_ACTIONS = ['search', 'detail', 'availability', 'contact'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'search') {
      let results = [...venues];

      if (data.city) {
        results = results.filter(v => v.city.toLowerCase().includes(data.city.toLowerCase()));
      }

      if (data.type && VALID_TYPES.includes(data.type)) {
        results = results.filter(v => v.type === data.type);
      }

      if (data.capacity) {
        results = results.filter(v => v.capacity >= Number(data.capacity));
      }

      if (data.maxPrice) {
        results = results.filter(v => v.price <= Number(data.maxPrice));
      }

      if (data.amenities && Array.isArray(data.amenities)) {
        results = results.filter(v => 
          data.amenities.every((a: string) => v.amenities.includes(a))
        );
      }

      return NextResponse.json({
        success: true,
        count: results.length,
        venues: results.map(v => ({
          id: v.id,
          name: v.name,
          city: v.city,
          type: v.type,
          capacity: v.capacity,
          price: v.price
        }))
      });
    }

    if (action === 'detail') {
      if (!data.venueId) {
        return NextResponse.json({ error: 'venueId required' }, { status: 400 });
      }

      const venue = venues.find(v => v.id === data.venueId);
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, venue });
    }

    if (action === 'availability') {
      if (!data.venueId || !data.date) {
        return NextResponse.json({ error: 'venueId and date required' }, { status: 400 });
      }

      const venue = venues.find(v => v.id === data.venueId);
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
      }

      const isAvailable = Math.random() > 0.3;

      return NextResponse.json({
        success: true,
        venue: venue.name,
        date: data.date,
        available: isAvailable,
        price: venue.price,
        note: isAvailable ? 'Available for booking' : 'Already booked'
      });
    }

    if (action === 'contact') {
      if (!data.venueId) {
        return NextResponse.json({ error: 'venueId required' }, { status: 400 });
      }

      const venue = venues.find(v => v.id === data.venueId);
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        contact: {
          venue: venue.name,
          email: venue.contact.includes('@') ? venue.contact : null,
          telegram: venue.contact.startsWith('@') ? venue.contact : null
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Venue Finder error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'venue-finder',
    name: 'Venue Finder',
    description: 'Find and book venues for events worldwide',
    security: { readOnly: true, mockData: true },
    actions: {
      search: 'Search venues by city, type, capacity, price',
      detail: 'Get venue details',
      availability: 'Check availability for date',
      contact: 'Get contact info'
    },
    filters: {
      type: VALID_TYPES,
      amenities: VALID_AMENTIES
    }
  });
}
