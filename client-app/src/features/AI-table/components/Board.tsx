import React, { useState, useCallback, useRef, useEffect } from 'react';
import { exportCities, readCitiesFromFile } from '../utils/boardPersistence';
import AttractionList, { Attraction } from './AttractionList';
import '../styles/Board.css';

export interface Column {
  id: string;
  title: string;
  tasks: Attraction[];
}

export interface TouristDestination {
  name: string;
  columns: Column[];
}

interface DragState {
  fromColumnId: string;
  taskIndex: number;
  height: number; // px height of dragged item
}

interface DragUIState {
  overColumnId: string | null;
  insertionIndex: number; // -1 when none
}

// No local sample; expect data to be passed in via props

interface BoardProps {
  initialCities?: TouristDestination[]; // optional; defaults to empty
  onCitiesLoaded?: (cities: TouristDestination[]) => void; // callback when cities are loaded from file
}

const Board: React.FC<BoardProps> = ({ initialCities, onCitiesLoaded }) => {
  const [cities, setCities] = useState<TouristDestination[]>(initialCities ?? []);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragUI, setDragUI] = useState<DragUIState>({ overColumnId: null, insertionIndex: -1 });
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [collapsedByCity, setCollapsedByCity] = useState<Record<string, boolean>>({});
  const [itinerarySelection, setItinerarySelection] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categoryOptions = [
    'POINT_OF_INTEREST_AND_LANDMARK',
    'HISTORIC_SITE',
    'RELIGIOUS_SITE',
    'ARENA_AND_STADIUM',
    'OTHER_LANDMARK',
    'SPECIALITY_MUSEUM',
    'ART_MUSEUM',
    'HISTORY_MUSEUM',
    'SCIENCE_MUSEUM',
    'OTHER_MUSEUM',
    'PARK',
    'NATURE_AND_WILDLIFE_AREA',
    'OTHER_NATURE_AND_PARK',
    'LAND_BASED_ACTIVITY',
    'AIR_BASED_ACTIVITY',
    'WATER_BASED_ACTIVITY',
    'OTHER_OUTDOOR_ACTIVITY',
    'SPORTING_EVENT',
    'CULTURAL_EVENT',
    'THEATRE_EVENT',
    'OTHER_EVENT',
    'SHOPPING',
    'ZOO_AND_AQUARIUM',
    'NIGHTLIFE',
    'FOOD',
    'DRINK',
    'WILDLIFE_TOUR',
    'EXTREME_SPORT_TOUR',
    'OTHER_TOUR',
    'WATER_AND_AMUSEMENT_PARK',
    'FILM_AND_TV_TOUR',
    'CLASS_AND_WORKSHOP',
    'OTHER_FUN_AND_GAME',
    'SPA_AND_WELLNESS',
    'EATERY',
    'BEVERAGE_SPOT'
  ] as const;

  interface Filters {
    isCountrywide: 'any' | 'true' | 'false';
    mustVisit: 'any' | 'true' | 'false';
    isTraditional: 'any' | 'true' | 'false';
    stable: 'any' | 'true' | 'false';
    category: 'any' | typeof categoryOptions[number];
  }
  const [filters, setFilters] = useState<Filters>({
    isCountrywide: 'any',
    mustVisit: 'any',
    isTraditional: 'any',
    stable: 'any',
    category: 'any'
  });

  const updateFilter = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Filters[typeof key];
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters({ isCountrywide: 'any', mustVisit: 'any', isTraditional: 'any', stable: 'any', category: 'any' });

  const handleExportJSON = useCallback(() => {
    exportCities(cities, 'cities-board');
  }, [cities]);

  const handleImportChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readCitiesFromFile(file)
      .then((imported: TouristDestination[]) => {
        if (imported.length) {
          setCities(imported);
          setDragState(null);
          setDragUI({ overColumnId: null, insertionIndex: -1 });
          // Initialize itinerary selection from imported data
          const selection: Record<number, boolean> = {};
          for (const city of imported) {
            for (const col of city.columns) {
              for (const t of col.tasks) {
                if (t.inItinerary) selection[t.id] = true;
              }
            }
          }
          setItinerarySelection(selection);
          onCitiesLoaded?.(imported);
        }
      })
      .catch((err: unknown) => console.error('Failed to import JSON', err))
      .finally(() => { e.target.value = ''; });
  }, [onCitiesLoaded]);

  const onDragStart = useCallback((colId: string, taskIndex: number) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // required for Firefox
    const element = e.currentTarget as HTMLElement;
    const height = element.getBoundingClientRect().height;
    setDragState({ fromColumnId: colId, taskIndex, height });
  }, []);

  const onDragOverColumn = useCallback((colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragState) return;
    e.preventDefault();
    const tasksUl = e.currentTarget.querySelector('ul.attractions');
    if (!tasksUl) return;
    const taskEls = Array.from(tasksUl.children).filter(el => el.classList.contains('attraction')) as HTMLLIElement[];
    let insertionIndex = taskEls.length;
    for (let i = 0; i < taskEls.length; i++) {
      const rect = taskEls[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        insertionIndex = i;
        break;
      }
    }
    setDragUI(prev => {
      if (prev.overColumnId === colId && prev.insertionIndex === insertionIndex) return prev;
      return { overColumnId: colId, insertionIndex };
    });
  }, [dragState]);

  const onDragLeaveColumn = useCallback((colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!dragState) return;
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragUI({ overColumnId: null, insertionIndex: -1 });
  }, [dragState]);

  const onDrop = useCallback((targetColumnId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState) return;
    setCities(prev => {
      // Find source column
      let sourceCityIdx = -1, sourceColIdx = -1;
      let targetCityIdx = -1, targetColIdx = -1;
      for (let ci = 0; ci < prev.length; ci++) {
        const cty = prev[ci];
        const sIdx = cty.columns.findIndex(c => c.id === dragState.fromColumnId);
        if (sIdx !== -1) { sourceCityIdx = ci; sourceColIdx = sIdx; }
        const tIdx = cty.columns.findIndex(c => c.id === targetColumnId);
        if (tIdx !== -1) { targetCityIdx = ci; targetColIdx = tIdx; }
      }
      if (sourceCityIdx === -1 || sourceColIdx === -1 || targetCityIdx === -1 || targetColIdx === -1) return prev;
      const next = prev.map(cty => ({ ...cty, columns: cty.columns.map(col => ({ ...col, tasks: [...col.tasks] })) }));
      const sourceColumn = next[sourceCityIdx].columns[sourceColIdx];
      const targetColumn = next[targetCityIdx].columns[targetColIdx];
      const attraction = sourceColumn.tasks[dragState.taskIndex];
      if (!attraction) return prev;
      sourceColumn.tasks.splice(dragState.taskIndex, 1);
      const insertionIndex = (dragUI.overColumnId === targetColumnId && dragUI.insertionIndex >= 0)
        ? Math.min(dragUI.insertionIndex, targetColumn.tasks.length)
        : targetColumn.tasks.length;
      targetColumn.tasks.splice(insertionIndex, 0, attraction);
      return next;
    });
    setDragState(null);
    setDragUI({ overColumnId: null, insertionIndex: -1 });
  }, [dragState, dragUI.insertionIndex, dragUI.overColumnId]);

  const updateAttractionNote = useCallback((columnId: string, index: number, newNote: string) => {
    if (readOnly) return;
    setCities(prev => prev.map(city => ({
      ...city,
      columns: city.columns.map(col => {
        if (col.id !== columnId) return col;
        const tasks = col.tasks.map((t, i) => i === index ? { ...t, note: newNote } : t);
        return { ...col, tasks };
      })
    })));
  }, [readOnly]);

  const updateAttractionWorkingHours = useCallback((columnId: string, index: number, newHours: string) => {
    if (readOnly) return;
    setCities(prev => prev.map(city => ({
      ...city,
      columns: city.columns.map(col => {
        if (col.id !== columnId) return col;
        const tasks = col.tasks.map((t, i) => i === index ? { ...t, workingHours: newHours || undefined } : t);
        return { ...col, tasks };
      })
    })));
  }, [readOnly]);

  const updateAttractionVisitTime = useCallback((columnId: string, index: number, newVisit: string) => {
    if (readOnly) return;
    setCities(prev => prev.map(city => ({
      ...city,
      columns: city.columns.map(col => {
        if (col.id !== columnId) return col;
        const tasks = col.tasks.map((t, i) => i === index ? { ...t, VisitTime: newVisit || '' } : t);
        return { ...col, tasks };
      })
    })));
  }, [readOnly]);

  const toggleAttractionMustVisit = useCallback((columnId: string, index: number) => {
    if (readOnly) return;
    setCities(prev => prev.map(city => ({
      ...city,
      columns: city.columns.map(col => {
        if (col.id !== columnId) return col;
        const tasks = col.tasks.map((t, i) => i === index ? { ...t, mustVisit: !t.mustVisit } : t);
        return { ...col, tasks };
      })
    })));
  }, [readOnly]);

    // Generic update by attraction id (hidden internal id).
    const updateAttractionById = useCallback((attractionId: number, partial: Partial<Attraction>) => {
      if (readOnly) return;
      setCities(prev => prev.map(city => ({
        ...city,
        columns: city.columns.map(col => ({
          ...col,
          tasks: col.tasks.map(t => t.id === attractionId ? { ...t, ...partial } : t)
        }))
      })));
  }, [readOnly]);

    // Upsert a batch of attractions into a column by id, avoiding duplicates.
    const upsertAttractions = useCallback((columnId: string, newAttractions: Attraction[]) => {
      if (readOnly) return;
      setCities(prev => prev.map(city => ({
        ...city,
        columns: city.columns.map(col => {
          if (col.id !== columnId) return col;
          const existingMap = new Map(col.tasks.map(t => [t.id, t] as const));
          for (const incoming of newAttractions) {
            if (existingMap.has(incoming.id)) {
              existingMap.set(incoming.id, { ...existingMap.get(incoming.id)!, ...incoming });
            } else {
              existingMap.set(incoming.id, incoming);
            }
          }
          return { ...col, tasks: Array.from(existingMap.values()) };
        })
      })));
  }, [readOnly]);

    // Sync internal state when initialCities prop changes
    useEffect(() => {
      // Always sync to prop, even when it's an empty array initially
      const next = initialCities ?? [];
      setCities(next);
      setDragState(null);
      setDragUI({ overColumnId: null, insertionIndex: -1 });
      // Rebuild itinerary selection map from attractions that have inItinerary set
      const selection: Record<number, boolean> = {};
      for (const city of next) {
        for (const col of city.columns) {
          for (const t of col.tasks) {
            if (t.inItinerary) selection[t.id] = true;
          }
        }
      }
      setItinerarySelection(selection);
      // Preserve existing collapse states; initialize new city keys to false
      setCollapsedByCity(prev => {
        const merged: Record<string, boolean> = { ...prev };
        for (const c of next) {
          if (!(c.name in merged)) merged[c.name] = false;
        }
        return merged;
      });
    }, [initialCities]);

    const toggleCityCollapse = useCallback((cityName: string) => {
      setCollapsedByCity(prev => ({ ...prev, [cityName]: !prev[cityName] }));
    }, []);

    const toggleItinerarySelection = useCallback((attractionId: number) => {
      setItinerarySelection(prev => {
        const isCurrentlyIn = !!prev[attractionId];
        const nextValue = !isCurrentlyIn;

        // Mirror this onto the underlying attraction objects so it is persisted in JSON
        setCities(prevCities => prevCities.map(city => ({
          ...city,
          columns: city.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(t =>
              t.id === attractionId ? { ...t, inItinerary: nextValue } : t
            )
          }))
        })));

        return {
          ...prev,
          [attractionId]: nextValue
        };
      });
    }, []);

    // Keyboard shortcuts:
    //  - Ctrl+V toggles read-only view
    //  - Ctrl+S triggers "Save JSON" export
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.ctrlKey || e.altKey || e.metaKey) return;

        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
        }

        const key = e.key.toLowerCase();
        if (key === 'v') {
          e.preventDefault();
          setReadOnly(prev => !prev);
        } else if (key === 's') {
          e.preventDefault();
          handleExportJSON();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleExportJSON]);

  return (
    <div className="attraction-board-wrapper">
      <div className="board-toolbar">
        <label className="readonly-toggle" title="Toggle read-only view (hide all editing controls)">
          <input type="checkbox" checked={readOnly} onChange={() => setReadOnly(r => !r)} /> Read-only view
        </label>
        <button type="button" onClick={handleExportJSON} className="export-json-btn" title="Download current board as JSON">Save JSON</button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="import-json-btn" title="Load board from JSON file">Load JSON</button>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportChange} />
        <div className="filters-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '6px' }}>
          <label>
            Countrywide
            <select value={filters.isCountrywide} onChange={updateFilter('isCountrywide')}>
              <option value="any">Any</option>
              <option value="true">Countrywide</option>
              <option value="false">Local</option>
            </select>
          </label>
          <label>
            Must Visit
            <select value={filters.mustVisit} onChange={updateFilter('mustVisit')}>
              <option value="any">Any</option>
              <option value="true">Must visit</option>
              <option value="false">Skip-Worthy Spots</option>
            </select>
          </label>
            <label>
              Traditional
              <select value={filters.isTraditional} onChange={updateFilter('isTraditional')}>
                <option value="any">Any</option>
                <option value="true">Traditional</option>
                <option value="false">Modern</option>
              </select>
            </label>
            <label>
              Stability
              <select value={filters.stable} onChange={updateFilter('stable')}>
                <option value="any">Any</option>
                <option value="true">Stable</option>
                <option value="false">Potential Change</option>
              </select>
            </label>
            <label>
              Category
              <select value={filters.category} onChange={updateFilter('category')}>
                <option value="any">Any</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>
      {cities.map(city => {
        // Check if all attractions are in the excluded column (last column)
        const excludedColumn = city.columns.find(col => col.title === 'Excluded Attractions');
        const nonExcludedColumns = city.columns.filter(col => col.title !== 'Excluded Attractions');
        const allInExcluded = nonExcludedColumns.every(col => col.tasks.length === 0) && 
                              excludedColumn && excludedColumn.tasks.length > 0;
        const isCollapsed = collapsedByCity[city.name];
        const showGray = isCollapsed && allInExcluded;

        // Check if all attractions under "Top Attractions" and "Secondary Spots" are marked in the itinerary
        const topAndSecondaryTasks = city.columns
          .filter(col => col.title === 'Top Attractions' || col.title === 'Secondary Spots')
          .flatMap(col => col.tasks);
        const allTopAndSecondaryPlanned = isCollapsed &&
          topAndSecondaryTasks.length > 0 &&
          topAndSecondaryTasks.every(t => itinerarySelection[t.id]);
        
        return (
        <div
          key={city.name}
          className={`city-group${showGray ? ' all-excluded' : ''}${allTopAndSecondaryPlanned ? ' all-planned' : ''}`}
        >
          <div className="city-header">
            <button
              type="button"
              className="city-collapse-btn"
              onClick={() => toggleCityCollapse(city.name)}
              aria-label={isCollapsed ? `Expand ${city.name}` : `Collapse ${city.name}`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
            <h1 className="city-title">{city.name}</h1>
          </div>
          {!collapsedByCity[city.name] && (
          <div className="attraction-board">
            {city.columns.map(col => {
              const showPlaceholder = dragState && dragUI.overColumnId === col.id;
              // Apply filtering to tasks
              const filteredTasks = col.tasks.filter(t => {
                if (filters.isCountrywide !== 'any') {
                  if ((filters.isCountrywide === 'true') !== t.isCountrywide) return false;
                }
                if (filters.mustVisit !== 'any') {
                  if ((filters.mustVisit === 'true') !== t.mustVisit) return false;
                }
                if (filters.isTraditional !== 'any') {
                  if ((filters.isTraditional === 'true') !== t.isTraditional) return false;
                }
                if (filters.stable !== 'any') {
                  if ((filters.stable === 'true') !== t.stable) return false;
                }
                if (filters.category !== 'any') {
                  if (t.category !== filters.category) return false;
                }
                return true;
              });
              return (
                <div
                  key={col.id}
                  className="attraction-board-column"
                  onDragOver={onDragOverColumn(col.id)}
                  onDragLeave={onDragLeaveColumn(col.id)}
                  onDrop={onDrop(col.id)}
                >
                  <h2>{col.title}</h2>
                  <AttractionList
                    attractions={filteredTasks}
                    showPlaceholder={!!showPlaceholder}
                    insertionIndex={dragUI.insertionIndex}
                    placeholderHeight={dragState?.height}
                    onDragStart={(taskIndex) => onDragStart(col.id, taskIndex)}
                    columnId={col.id}
                    locationHint={city.name}
                    onUpdateNote={updateAttractionNote}
                    onUpdateWorkingHours={updateAttractionWorkingHours}
                    onUpdateVisitTime={updateAttractionVisitTime}
                    onToggleMustVisit={toggleAttractionMustVisit}
                    updateById={updateAttractionById}
                    upsertAttractions={upsertAttractions}
                    isInItinerary={(id) => !!itinerarySelection[id]}
                    onToggleItinerary={toggleItinerarySelection}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default Board;
