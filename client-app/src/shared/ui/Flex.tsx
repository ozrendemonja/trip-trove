import React, { CSSProperties } from "react";
import { getFlexItemStyle, getFlexStyle } from "./Flex.styles";

export type FlexProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "column";
  wrap?: boolean;
  gap?: CSSProperties["gap"];
  padding?: CSSProperties["padding"];
  justify?: CSSProperties["justifyContent"];
  align?: CSSProperties["alignItems"];
  fill?: boolean;
  grow?: boolean | number;
};

export const Flex: React.FC<FlexProps> = ({
  direction = "column",
  wrap,
  gap,
  padding,
  justify,
  align,
  fill,
  grow,
  style,
  children,
  ...props
}) => (
  <div
    {...props}
    style={getFlexStyle(
      { direction, wrap, gap, padding, justify, align, fill, grow },
      style
    )}
  >
    {children}
  </div>
);

export type FlexItemProps = React.HTMLAttributes<HTMLDivElement> & {
  grow?: boolean | number;
};

export const FlexItem: React.FC<FlexItemProps> = ({
  grow,
  style,
  children,
  ...props
}) => (
  <div {...props} style={getFlexItemStyle(grow, style)}>
    {children}
  </div>
);
