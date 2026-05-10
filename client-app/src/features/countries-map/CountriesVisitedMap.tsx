import { Stack, Text } from "@fluentui/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { WorldMap } from "react-svg-worldmap";
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

const INITIAL_EUROPE_SCALE = 4;
const MIN_SCALE = 1;
const MAX_SCALE = 40;
const WHEEL_FACTOR = 1.2;
const BUTTON_FACTOR = 1.4;

// react-svg-worldmap draws into an SVG sized widthPx \u00d7 (widthPx * 0.5) (the
// `heightRatio`). Internally a <g> applies translate(0, 240) before scaling by
// widthPx/960, so a d3-mercator point (px_d3, py_d3) ends up at SVG user
// coords (px_d3 * widthPx/960, (py_d3 + 240) * widthPx/960). We zoom by
// mutating the SVG's viewBox attribute \u2014 fully vector, never blurry.
// Europe focus point (lon 15\u00b0E, lat 49\u00b0N) \u2192 d3 (\u2248519.27, \u2248105.4) \u2192
// fractions of widthPx for both axes:
const EUROPE_FOCUS_X_FRAC = 519.27 / 960; // \u2248 0.541 of svg widthPx
const EUROPE_FOCUS_Y_FRAC = (105.4 + 240) / 960; // \u2248 0.360 of svg widthPx

interface View {
  // Center of the visible viewBox, expressed as a fraction of the SVG's
  // current width. Stored normalized so the focus stays on the same world
  // point even when react-svg-worldmap recomputes its intrinsic SVG width
  // (it does on every container/window resize, which would otherwise shift
  // every country in user-coord space and silently move our cached focus
  // — e.g. from Europe to Greenland on bigger screens).
  cxN: number;
  cyN: number;
  scale: number;
}

const clampScale = (s: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

export const CountriesVisitedMap: React.FunctionComponent = () => {
  const classes = useClasses();
  const [summaries, setSummaries] = useState<CountryVisitSummary[]>([]);
  const [selected, setSelected] = useState<MappedCountry | undefined>(
    undefined
  );
  const [view, setView] = useState<View>({
    cxN: EUROPE_FOCUS_X_FRAC,
    cyN: EUROPE_FOCUS_Y_FRAC,
    scale: 1
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<View>(view);
  const initializedRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    getCountryVisitSummaries().then(setSummaries);
  }, []);

  // Read the SVG's natural pixel dimensions (set as width/height attributes by
  // the library). Returns null until the library has rendered the SVG.
  const getSvgSize = useCallback((): { w: number; h: number } | null => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return null;
    const w = svg.width.baseVal.value;
    const h = svg.height.baseVal.value;
    if (!w || !h) return null;
    return { w, h };
  }, []);

  // Translate a container pixel coord into the SVG's user-coord space, taking
  // the current viewBox + preserveAspectRatio="xMidYMid meet" letterboxing
  // into account.
  const containerToUserCoords = useCallback(
    (px: number, py: number): { ux: number; uy: number } | null => {
      const container = containerRef.current;
      const size = getSvgSize();
      if (!container || !size) return null;
      const rect = container.getBoundingClientRect();
      const v = viewRef.current;
      const cx = v.cxN * size.w;
      const cy = v.cyN * size.w;
      const vbW = size.w / v.scale;
      const vbH = size.h / v.scale;
      // Aspect-fit (meet) of viewBox into container.
      const fit = Math.min(rect.width / vbW, rect.height / vbH);
      const offX = (rect.width - vbW * fit) / 2;
      const offY = (rect.height - vbH * fit) / 2;
      const ux = cx - vbW / 2 + (px - offX) / fit;
      const uy = cy - vbH / 2 + (py - offY) / fit;
      return { ux, uy };
    },
    [getSvgSize]
  );

  // Apply current view to the SVG element (sets viewBox + preserveAspectRatio).
  const applyView = useCallback(
    (v: View): void => {
      const svg = containerRef.current?.querySelector("svg");
      const size = getSvgSize();
      if (!svg || !size) return;
      const cx = v.cxN * size.w;
      const cy = v.cyN * size.w;
      const vbW = size.w / v.scale;
      const vbH = size.h / v.scale;
      const x = cx - vbW / 2;
      const y = cy - vbH / 2;
      svg.setAttribute("viewBox", `${x} ${y} ${vbW} ${vbH}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    },
    [getSvgSize]
  );

  // Re-apply on every render (data/view change may rerender the lib's SVG).
  useEffect(() => {
    applyView(view);
  });

  // Re-apply whenever the container resizes (the library recomputes the SVG's
  // intrinsic width on resize — without this the focus would visibly drift).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => applyView(viewRef.current));
    ro.observe(container);
    return () => ro.disconnect();
  }, [applyView]);

  const focusOnEurope = useCallback((): void => {
    setView({
      cxN: EUROPE_FOCUS_X_FRAC,
      cyN: EUROPE_FOCUS_Y_FRAC,
      scale: INITIAL_EUROPE_SCALE
    });
  }, []);

  // Initial Europe focus once the SVG has been rendered with real dimensions.
  useEffect(() => {
    if (initializedRef.current) return;
    const tryInit = (): boolean => {
      if (!getSvgSize()) return false;
      initializedRef.current = true;
      focusOnEurope();
      return true;
    };
    if (tryInit()) return;
    const id = window.setInterval(() => {
      if (tryInit()) window.clearInterval(id);
    }, 50);
    return () => window.clearInterval(id);
  }, [focusOnEurope, getSvgSize]);

  // Native wheel listener so we can preventDefault (React wheel is passive).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cursorWorld = containerToUserCoords(px, py);
      const size = getSvgSize();
      if (!cursorWorld || !size) return;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR;
      const newScale = clampScale(v.scale * factor);
      // Solve so cursorWorld stays under the cursor at the new scale.
      const newVbW = size.w / newScale;
      const newVbH = size.h / newScale;
      const fit2 = Math.min(rect.width / newVbW, rect.height / newVbH);
      const offX2 = (rect.width - newVbW * fit2) / 2;
      const offY2 = (rect.height - newVbH * fit2) / 2;
      const newCx = cursorWorld.ux - (px - offX2) / fit2 + newVbW / 2;
      const newCy = cursorWorld.uy - (py - offY2) / fit2 + newVbH / 2;
      setView({ cxN: newCx / size.w, cyN: newCy / size.w, scale: newScale });
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerToUserCoords, getSvgSize]);

  const zoomBy = (factor: number): void => {
    const container = containerRef.current;
    const size = getSvgSize();
    if (!container || !size) return;
    const rect = container.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    const center = containerToUserCoords(px, py);
    if (!center) return;
    const v = viewRef.current;
    const newScale = clampScale(v.scale * factor);
    const newVbW = size.w / newScale;
    const newVbH = size.h / newScale;
    const fit2 = Math.min(rect.width / newVbW, rect.height / newVbH);
    const offX2 = (rect.width - newVbW * fit2) / 2;
    const offY2 = (rect.height - newVbH * fit2) / 2;
    const newCx = center.ux - (px - offX2) / fit2 + newVbW / 2;
    const newCy = center.uy - (py - offY2) / fit2 + newVbH / 2;
    setView({ cxN: newCx / size.w, cyN: newCy / size.w, scale: newScale });
  };

  // Mouse-drag pan with click suppression so that drags don't select a country.
  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    const size = getSvgSize();
    if (!container || !size) return;
    const rect = container.getBoundingClientRect();
    const v = viewRef.current;
    const vbW = size.w / v.scale;
    const vbH = size.h / v.scale;
    const fit = Math.min(rect.width / vbW, rect.height / vbH);
    const startX = e.clientX;
    const startY = e.clientY;
    const startCx = v.cxN * size.w;
    const startCy = v.cyN * size.w;
    const startScale = v.scale;
    let moved = false;

    const onMove = (ev: MouseEvent): void => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      moved = true;
      // Convert pixel drag into SVG user coords (inverse of `fit`), then
      // store normalized so the focus survives any later SVG resize.
      setView({
        cxN: (startCx - dx / fit) / size.w,
        cyN: (startCy - dy / fit) / size.w,
        scale: startScale
      });
    };

    const onUp = (): void => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (moved) {
        suppressNextClickRef.current = true;
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const codeToCountry = useMemo(() => {
    const map = new Map<string, MappedCountry>();
    for (const summary of summaries) {
      const isoCode = summary.isoCode;
      if (!isoCode) continue;
      map.set(isoCode, {
        isoCode,
        status: classifyCountry(summary),
        summary
      });
    }
    return map;
  }, [summaries]);

  const data = useMemo(
    () =>
      Array.from(codeToCountry.values()).map((c) => ({
        country: c.isoCode as never,
        value: c.summary.visitedMustVisit
      })),
    [codeToCountry]
  );

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
            ref={containerRef}
            className={classes.mapWrapper}
            onMouseDown={handleMouseDown}
            onClickCapture={(e) => {
              if (suppressNextClickRef.current) {
                suppressNextClickRef.current = false;
                e.stopPropagation();
                e.preventDefault();
                return;
              }
              // Click on background (not a country path) deselects.
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
            <div ref={transformRef} className={classes.mapTransform}>
              <WorldMap
                size="responsive"
                backgroundColor="transparent"
                color={COLOR_GOLD}
                strokeOpacity={0.3}
                data={data}
                styleFunction={(ctx) => {
                  const code = ctx.countryCode.toLowerCase();
                  const country = codeToCountry.get(code);
                  return {
                    fill: country
                      ? statusToColor(country.status)
                      : COLOR_DEFAULT,
                    stroke: "rgba(0,0,0,0.55)",
                    // With vector-effect:non-scaling-stroke this is in screen
                    // pixels at every zoom level, so 1 = a single crisp line.
                    strokeWidth: 1,
                    cursor: country ? "pointer" : "default"
                  };
                }}
                tooltipTextFunction={(ctx) => {
                  const code = ctx.countryCode.toLowerCase();
                  const country = codeToCountry.get(code);
                  if (!country) return ctx.countryName;
                  const s = country.summary;
                  return `${ctx.countryName}: must-visit ${s.visitedMustVisit}/${s.visitedMustVisit + s.unvisitedMustVisit} visited`;
                }}
                onClickFunction={(ctx) => {
                  if (suppressNextClickRef.current) return;
                  const event = (
                    ctx as { event?: { stopPropagation?: () => void } }
                  ).event;
                  event?.stopPropagation?.();
                  const code = ctx.countryCode.toLowerCase();
                  const country = codeToCountry.get(code);
                  setSelected(country);
                }}
              />
            </div>
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
