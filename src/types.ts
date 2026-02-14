/** Raw OSM node */
export interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

/** Raw OSM way */
export interface OsmWay {
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

/** Parsed map data ready for fantasy conversion */
export interface MapData {
  bounds: { south: number; west: number; north: number; east: number };
  buildings: Building[];
  roads: Road[];
  waterAreas: Polygon[];
  greenAreas: Polygon[];
  /** Elevation grid: rows x cols of height values (meters) */
  elevation: number[][];
  elevationBounds: { minElev: number; maxElev: number };
}

export interface Building {
  polygon: [number, number][];  // [x, z] local coords
  height: number;
  type: FantasyBuildingType;
  tags: Record<string, string>;
}

export interface Road {
  points: [number, number][];   // [x, z] local coords
  width: number;
  type: FantasyRoadType;
}

export interface Polygon {
  points: [number, number][];   // [x, z] local coords
}

export type FantasyBuildingType =
  | 'castle'
  | 'tower'
  | 'cottage'
  | 'temple'
  | 'tavern'
  | 'fortress'
  | 'windmill';

export type FantasyRoadType =
  | 'stone_road'
  | 'dirt_path'
  | 'bridge';

/** Application state */
export interface AppState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  mapData: MapData | null;
  error: string | null;
  searchQuery: string;
}
