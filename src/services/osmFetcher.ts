import type { MapData, Building, Road, Polygon, OsmNode, OsmWay, FantasyBuildingType, FantasyRoadType } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/** Geocode a place name using Nominatim */
export async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FantasyMapGenerator/1.0' },
  });
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

/** Fetch OSM data around a center point */
export async function fetchMapData(lat: number, lon: number, radiusKm: number = 0.5): Promise<MapData> {
  const degOffset = radiusKm / 111.32;
  const bounds = {
    south: lat - degOffset,
    west: lon - degOffset / Math.cos((lat * Math.PI) / 180),
    north: lat + degOffset,
    east: lon + degOffset / Math.cos((lat * Math.PI) / 180),
  };

  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;

  const query = `
    [out:json][timeout:30];
    (
      way["building"](${bbox});
      way["highway"](${bbox});
      way["natural"="water"](${bbox});
      relation["natural"="water"](${bbox});
      way["waterway"](${bbox});
      way["landuse"="forest"](${bbox});
      way["natural"="wood"](${bbox});
      way["leisure"="park"](${bbox});
      way["landuse"="grass"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const osm = await res.json();

  const nodes = new Map<number, OsmNode>();
  const ways: OsmWay[] = [];

  for (const el of osm.elements) {
    if (el.type === 'node') {
      nodes.set(el.id, el as OsmNode);
    } else if (el.type === 'way') {
      ways.push(el as OsmWay);
    }
  }

  // Coordinate conversion: lat/lon → local x/z meters centered on bounds center
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLon = (bounds.west + bounds.east) / 2;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((centerLat * Math.PI) / 180);

  function toLocal(lat: number, lon: number): [number, number] {
    return [
      (lon - centerLon) * metersPerDegLon,
      -(lat - centerLat) * metersPerDegLat, // flip z so north is -z (Three.js convention)
    ];
  }

  function wayToPoints(way: OsmWay): [number, number][] {
    const pts: [number, number][] = [];
    for (const nid of way.nodes) {
      const n = nodes.get(nid);
      if (n) pts.push(toLocal(n.lat, n.lon));
    }
    return pts;
  }

  const buildings: Building[] = [];
  const roads: Road[] = [];
  const waterAreas: Polygon[] = [];
  const greenAreas: Polygon[] = [];

  for (const way of ways) {
    const tags = way.tags || {};
    const pts = wayToPoints(way);
    if (pts.length < 2) continue;

    if (tags.building) {
      buildings.push({
        polygon: pts,
        height: parseFloat(tags['building:levels'] || '2') * 3.5,
        type: classifyBuilding(tags),
        tags,
      });
    } else if (tags.highway) {
      roads.push({
        points: pts,
        width: roadWidth(tags.highway),
        type: classifyRoad(tags),
      });
    } else if (tags.natural === 'water' || tags.waterway) {
      waterAreas.push({ points: pts });
    } else if (
      tags.landuse === 'forest' ||
      tags.natural === 'wood' ||
      tags.leisure === 'park' ||
      tags.landuse === 'grass'
    ) {
      greenAreas.push({ points: pts });
    }
  }

  // Generate procedural elevation
  const elevation = generateElevation(bounds, 64);

  const allElev = elevation.flat();
  const minElev = Math.min(...allElev);
  const maxElev = Math.max(...allElev);

  return {
    bounds,
    buildings,
    roads,
    waterAreas,
    greenAreas,
    elevation,
    elevationBounds: { minElev, maxElev },
  };
}

/** Classify building into fantasy type based on OSM tags */
function classifyBuilding(tags: Record<string, string>): FantasyBuildingType {
  const building = tags.building || '';
  const amenity = tags.amenity || '';
  const levels = parseInt(tags['building:levels'] || '2', 10);

  if (tags.historic === 'castle' || tags.castle) return 'castle';
  if (amenity === 'place_of_worship' || tags.religion) return 'temple';
  if (amenity === 'pub' || amenity === 'bar' || amenity === 'restaurant') return 'tavern';
  if (building === 'industrial' || tags.man_made === 'tower') return 'tower';
  if (levels >= 5 || building === 'apartments') return 'fortress';
  if (tags.power === 'generator' || building === 'farm_auxiliary') return 'windmill';
  if (building === 'church' || building === 'cathedral') return 'temple';
  return 'cottage';
}

/** Classify road into fantasy type */
function classifyRoad(tags: Record<string, string>): FantasyRoadType {
  const hw = tags.highway || '';
  if (tags.bridge === 'yes') return 'bridge';
  if (['primary', 'secondary', 'tertiary', 'trunk', 'motorway'].includes(hw)) return 'stone_road';
  return 'dirt_path';
}

/** Road width in meters based on highway type */
function roadWidth(highway: string): number {
  const widths: Record<string, number> = {
    motorway: 8, trunk: 7, primary: 6, secondary: 5,
    tertiary: 4, residential: 3, service: 2, footway: 1.5,
    path: 1, cycleway: 1.5, track: 2,
  };
  return widths[highway] || 3;
}

/** Generate procedural elevation grid using simple noise */
function generateElevation(
  bounds: { south: number; west: number; north: number; east: number },
  resolution: number
): number[][] {
  const grid: number[][] = [];
  for (let row = 0; row < resolution; row++) {
    const line: number[] = [];
    for (let col = 0; col < resolution; col++) {
      const x = col / resolution;
      const z = row / resolution;
      // Multi-octave simple noise for interesting terrain
      let h = 0;
      h += Math.sin(x * 6.28 * 2 + 0.5) * Math.cos(z * 6.28 * 3 + 1.2) * 15;
      h += Math.sin(x * 6.28 * 5 + 2.1) * Math.cos(z * 6.28 * 4 + 0.8) * 8;
      h += Math.sin(x * 6.28 * 11 + 3.7) * Math.cos(z * 6.28 * 9 + 2.4) * 3;
      h += 10; // base height to keep above zero
      line.push(Math.max(0, h));
    }
    grid.push(line);
  }
  return grid;
}
