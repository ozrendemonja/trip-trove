import type { CSSProperties } from "react";

export interface FlexStyleOptions {
  direction: "row" | "column";
  wrap?: boolean;
  gap?: CSSProperties["gap"];
  padding?: CSSProperties["padding"];
  justify?: CSSProperties["justifyContent"];
  align?: CSSProperties["alignItems"];
  fill?: boolean;
  grow?: boolean | number;
}

const toFlexGrow = (
  grow: boolean | number | undefined
): CSSProperties["flexGrow"] => {
  if (grow === true) return 1;
  if (typeof grow === "number") return grow;
  return undefined;
};

export const getFlexStyle = (
  options: FlexStyleOptions,
  style?: CSSProperties
): CSSProperties => ({
  display: "flex",
  flexDirection: options.direction,
  flexWrap: options.wrap ? "wrap" : undefined,
  gap: options.gap,
  padding: options.padding,
  justifyContent: options.justify,
  alignItems: options.align,
  minHeight: options.fill ? "100%" : undefined,
  flexGrow: toFlexGrow(options.grow),
  ...style
});

export const getFlexItemStyle = (
  grow: boolean | number | undefined,
  style?: CSSProperties
): CSSProperties => ({
  flexGrow: toFlexGrow(grow),
  ...style
});
