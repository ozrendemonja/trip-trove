import { Stack, Text } from "@fluentui/react";
import countries from "i18n-iso-countries";
import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import topology from "world-atlas/countries-50m.json";
import Navigation from "../../shared/navigation/Navigation";
import {
  CountryVisitSummary,
  getCountryVisitSummaries
} from "../continent/infra/ManagerApi";
import {
  COLOR_DEFAULT,
  COLOR_GOLD,
  COLOR_GRAY,
  COLOR_YELLOW,
  useClasses
} from "./CountriesVisitedMap.styles";

type CountryStatus = "GRAY" | "YELLOW" | "GOLD" | "NONE";

const classifyCountry = (summary: CountryVisitSummary): CountryStatus => {
  const totalMustVisit = summary.visitedMustVisit + summary.unvisitedMustVisit;
  if (totalMustVisit === 0) return "NONE";
  if (summary.visitedMustVisit === 0) return "GOLD";
  if (summary.unvisitedMustVisit === 0) return "GRAY";
  return "YELLOW";
};

const statusToColor = (status: CountryStatus): string => {
  switch (status) {
    case "GRAY":
      return COLOR_GRAY;
    case "YELLOW":
      return COLOR_YELLOW;
    case "GOLD":
      return COLOR_GOLD;
    default:
      return COLOR_DEFAULT;
  }
};

interface MappedCountry {
  isoCode: string;
  status: CountryStatus;
  summary: CountryVisitSummary;
}

// Initial Europe focus (lon, lat) and zoom level for the ZoomableGroup.
const EUROPE_CENTER: [number, number] = [15, 49];
const INITIAL_EUROPE_ZOOM = 4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 40;
const BUTTON_FACTOR = 1.4;

// react-simple-maps `<Geography>` accepts an SVG `id` as a string number from
// the Natural Earth 1:50m TopoJSON (UN M49 numeric code). Convert to ISO
// 3166-1 alpha-2 (lowercase) so it matches the backend's `isoCode`.
const numericToAlpha2 = (id: string | number | undefined): string => {
  if (id === undefined || id === null) return "";
  const padded = String(id).padStart(3, "0");
  const alpha2 = countries.numericToAlpha2(padded);
  return alpha2 ? alpha2.toLowerCase() : "";
};

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

interface GeoFeature {
  rsmKey: string;
  id?: string | number;
  properties: { name?: string };
}

export const CountriesVisitedMap: React.FunctionComponent = () => {
  const classes = useClasses();
  const [summaries, setSummaries] = useState<CountryVisitSummary[]>([]);
  const [selected, setSelected] = useState<MappedCountry | undefined>(
    undefined
  );
  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({ coordinates: EUROPE_CENTER, zoom: INITIAL_EUROPE_ZOOM });
  const [tooltip, setTooltip] = useState<TooltipState | undefined>(undefined);

  useEffect(() => {
    getCountryVisitSummaries().then(setSummaries);
  }, []);

  const codeToCountry = useMemo(() => {
    const map = new Map<string, MappedCountry>();
    for (const summary of summaries) {
      const isoCode = summary.isoCode;
      if (!isoCode) continue;
      map.set(isoCode.toLowerCase(), {
        isoCode: isoCode.toLowerCase(),
        status: classifyCountry(summary),
        summary
      });
    }
    return map;
  }, [summaries]);

  const focusOnEurope = useCallback((): void => {
    setPosition({ coordinates: EUROPE_CENTER, zoom: INITIAL_EUROPE_ZOOM });
  }, []);

  const zoomBy = (factor: number): void => {
    setPosition((p) => ({
      coordinates: p.coordinates,
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.zoom * factor))
    }));
  };

  const tooltipFor = (
    geo: GeoFeature,
    country: MappedCountry | undefined
  ): string => {
    const name = country?.summary.countryName ?? geo.properties.name ?? "";
    if (!country) return name;
    const s = country.summary;
    return `${name}: must-visit ${s.visitedMustVisit}/${
      s.visitedMustVisit + s.unvisitedMustVisit
    } visited`;
  };

  return (
    <>
      <Navigation />
      <div className={classes.container}>
        <Text as="h1" className={classes.header}>
          Countries visited map
        </Text>
        <div className={classes.legend}>
          <div className={classes.legendItem}>
            <span
              className={classes.legendSwatch}
              style={{ background: COLOR_GOLD }}
            />
            Not visited any must-visit
          </div>
          <div className={classes.legendItem}>
            <span
              className={classes.legendSwatch}
              style={{ background: COLOR_YELLOW }}
            />
            Some must-visit visited
          </div>
          <div className={classes.legendItem}>
            <span
              className={classes.legendSwatch}
              style={{ background: COLOR_GRAY }}
            />
            All must-visit visited
          </div>
        </div>
        <div className={classes.mapAndDetails}>
          <div
            className={classes.mapWrapper}
            onClickCapture={(e) => {
              // Click outside any country path deselects.
              if ((e.target as Element).tagName !== "path") {
                setSelected(undefined);
              }
            }}
          >
            <div className={classes.zoomControls}>
              <button
                type="button"
                className={classes.zoomButton}
                onClick={() => zoomBy(BUTTON_FACTOR)}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className={classes.zoomButton}
                onClick={() => zoomBy(1 / BUTTON_FACTOR)}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className={classes.zoomButton}
                onClick={() => focusOnEurope()}
                aria-label="Reset zoom"
              >
                ⟲
              </button>
            </div>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 140 }}
              width={800}
              height={500}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                center={position.coordinates}
                zoom={position.zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onMoveEnd={(p) =>
                  setPosition({
                    coordinates: p.coordinates as [number, number],
                    zoom: p.zoom
                  })
                }
              >
                <Geographies geography={topology}>
                  {({ geographies }: { geographies: GeoFeature[] }) =>
                    geographies.map((geo) => {
                      const code = numericToAlpha2(geo.id);
                      const country = codeToCountry.get(code);
                      const fill = country
                        ? statusToColor(country.status)
                        : COLOR_DEFAULT;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="rgba(0,0,0,0.55)"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              fill,
                              outline: "none",
                              cursor: country ? "pointer" : "default"
                            },
                            pressed: { fill, outline: "none" }
                          }}
                          onMouseEnter={(e) => {
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              text: tooltipFor(geo, country)
                            });
                          }}
                          onMouseMove={(e) => {
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              text: tooltipFor(geo, country)
                            });
                          }}
                          onMouseLeave={() => setTooltip(undefined)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (country) setSelected(country);
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
            {tooltip && (
              <div
                className={classes.tooltip}
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
          {selected && (
            <div className={classes.detailsPanel}>
              <Stack tokens={{ childrenGap: 4 }}>
                <Text variant="xLarge">{selected.summary.countryName}</Text>
                <div className={classes.detailRow}>
                  <span className={classes.detailLabel}>Visited</span>
                  <span className={classes.detailValue}>
                    {selected.summary.visitedMustVisit +
                      selected.summary.visitedOther}
                  </span>
                </div>
                <div className={classes.detailRow}>
                  <span className={classes.detailLabel}>
                    Must-visit not visited
                  </span>
                  <span className={classes.detailValue}>
                    {selected.summary.unvisitedMustVisit}
                  </span>
                </div>
                <div className={classes.detailRow}>
                  <span className={classes.detailLabel}>Other not visited</span>
                  <span className={classes.detailValue}>
                    {selected.summary.unvisitedOther}
                  </span>
                </div>
              </Stack>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CountriesVisitedMap;
