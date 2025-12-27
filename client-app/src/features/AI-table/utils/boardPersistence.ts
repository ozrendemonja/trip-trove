import type { Column, TouristDestination } from '../components/Board';
import type { Attraction } from '../components/AttractionList';

// Single Responsibility: All persistence (serialize/parse/file IO) isolated here.
// Open for extension: Additional versioning or schema evolution can be added without touching Board UI.
// Liskov: Functions return validated structures compatible with Board expectations.
// Interface Segregation: Board consumes only high-level helpers (exportCities, readCitiesFromFile).
// Dependency Inversion: Board depends on these abstractions rather than inlined implementation details.

function sanitizeAttraction(raw: any): Attraction {
  return {
    id: Number(raw.id || ''),
    mustVisit: !!raw.mustVisit,
    stable: !!raw.stable,
    isTraditional: !!raw.isTraditional,
    isCountrywide: !!raw.isCountrywide,
    inItinerary: !!raw.inItinerary,
    name: String(raw.name || ''),
    address: String(raw.address || ''),
    category: String(raw.category || ''),
    infoFrom: String(raw.infoFrom || ''),
    note: String(raw.note || ''),
    optimalVisitPeriod: raw.optimalVisitPeriod ? String(raw.optimalVisitPeriod) : undefined,
    workingHours: raw.workingHours ? String(raw.workingHours) : undefined,
    VisitTime: String(raw.VisitTime || '')
  };
}

function sanitizeColumns(raw: any): Column[] {
  const candidate = Array.isArray(raw) ? raw : raw?.columns;
  if (!Array.isArray(candidate)) return [];
  return candidate.map(c => ({
    id: String(c.id || ''),
    title: String(c.title || ''),
    tasks: Array.isArray(c.tasks) ? c.tasks.map(sanitizeAttraction) : []
  })).filter(c => c.id && c.title);
}

function sanitizeCities(raw: any): TouristDestination[] {
  if (Array.isArray(raw)) {
    // Could be array of columns (legacy) or array of cities.
    const maybeColumns = raw.every(item => 'tasks' in item && 'title' in item && !('columns' in item));
    if (maybeColumns) {
      return [{ name: 'Imported', columns: sanitizeColumns(raw) }];
    }
  }
  const candidate = raw?.cities;
  if (Array.isArray(candidate)) {
    return candidate.map((touristDestination: any, idx: number) => ({
      name: String(touristDestination.name || `TouristDestination ${idx+1}`),
      columns: sanitizeColumns(touristDestination.columns)
    })).filter(c => c.columns.length);
  }
  // Legacy fallback: single columns object
  const legacyColumns = sanitizeColumns(raw);
  return legacyColumns.length ? [{ name: 'Imported', columns: legacyColumns }] : [];
}

export function serializeCities(cities: TouristDestination[]): string {
  return JSON.stringify({ cities }, null, 2);
}

function triggerDownload(serialized: string, filenameBase?: string) {
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `${filenameBase || 'attractions-board'}-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCities(cities: TouristDestination[], filenameBase?: string) {
  const serialized = serializeCities(cities);
  triggerDownload(serialized, filenameBase || 'cities-board');
}

export function parseCitiesFromJSON(json: string): TouristDestination[] {
  try {
    const parsed = JSON.parse(json);
    return sanitizeCities(parsed);
  } catch {
    return [];
  }
}

export function readCitiesFromFile(file: File): Promise<TouristDestination[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.onload = () => {
      const text = String(reader.result || '');
      const cities = parseCitiesFromJSON(text);
      resolve(cities);
    };
    reader.readAsText(file);
  });
}

// Legacy exports kept (optional) for backward compatibility if needed:
export function exportColumns(columns: Column[], filenameBase?: string) {
  const serialized = JSON.stringify({ columns }, null, 2);
  triggerDownload(serialized, filenameBase || 'attractions-board');
}
export function readColumnsFromFile(file: File): Promise<Column[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.onload = () => {
      const text = String(reader.result || '');
      try {
        const parsed = JSON.parse(text);
        resolve(sanitizeColumns(parsed));
      } catch {
        resolve([]);
      }
    };
    reader.readAsText(file);
  });
}
