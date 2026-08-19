import { makeStyles } from "@fluentui/react-components";
import type { CSSProperties } from "react";

export const getNavigationEntryStyle = (depth: number): CSSProperties => ({
  paddingInlineStart: 12 + depth * 16
});

export const useNavigationMenuStyles = makeStyles({
  expandedChevron: {
    transform: "rotate(180deg)"
  }
});
