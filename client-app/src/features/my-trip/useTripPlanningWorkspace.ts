import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject
} from "react";

interface PlanningWorkspace {
  beginWrite: () => (() => void) | undefined;
  isWriting: () => boolean;
  writeVersion: () => number;
  invalidateReads: () => void;
  hasLocalWork: () => boolean;
  trackDraft: (discard: () => void) => () => void;
  discardDrafts: () => void;
}

export const TripPlanningWorkspace = createContext<
  PlanningWorkspace | undefined
>(undefined);
export type { PlanningWorkspace };

export function useTripPlanningWorkspace(hasGuardedWork: RefObject<boolean>): {
  workspace: PlanningWorkspace;
  hasDrafts: boolean;
} {
  const writing = useRef(false);
  const version = useRef(0);
  const drafts = useRef(new Set<() => void>());
  const [hasDrafts, setHasDrafts] = useState(false);
  const workspace = useMemo<PlanningWorkspace>(
    () => ({
      beginWrite: () => {
        if (writing.current) return;
        writing.current = true;
        version.current++;
        return () => {
          writing.current = false;
        };
      },
      isWriting: () => writing.current,
      writeVersion: () => version.current,
      invalidateReads: () => {
        version.current++;
      },
      hasLocalWork: () =>
        writing.current || drafts.current.size > 0 || hasGuardedWork.current,
      trackDraft: (discard) => {
        drafts.current.add(discard);
        setHasDrafts(true);
        return () => {
          drafts.current.delete(discard);
          setHasDrafts(drafts.current.size > 0);
        };
      },
      discardDrafts: () => {
        for (const discard of drafts.current) discard();
      }
    }),
    [hasGuardedWork]
  );
  return { workspace, hasDrafts };
}

export function usePlanningDraft(active: boolean, discard: () => void): void {
  const workspace = useContext(TripPlanningWorkspace);
  const latestDiscard = useRef(discard);
  useLayoutEffect(() => {
    latestDiscard.current = discard;
  }, [discard]);
  useLayoutEffect(
    () =>
      active ? workspace?.trackDraft(() => latestDiscard.current()) : undefined,
    [active, workspace]
  );
}

export function usePlanningReads(
  tripId: number | undefined,
  workspace?: PlanningWorkspace
): {
  hasRequested: () => boolean;
  start: () => {
    signal: AbortSignal;
    isLatest: () => boolean;
    isCurrent: () => boolean;
  };
} {
  const request = useRef<AbortController>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      request.current = null;
    },
    [tripId]
  );
  const start = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const version = workspace?.writeVersion();
    // Ignore results captured before a planning write, even if abort didn't stop the response.
    const isLatest = (): boolean => !controller.signal.aborted;
    return {
      signal: controller.signal,
      isLatest,
      isCurrent: () => isLatest() && version === workspace?.writeVersion()
    };
  }, [workspace]);
  const hasRequested = useCallback(() => request.current !== null, []);
  return { start, hasRequested };
}
