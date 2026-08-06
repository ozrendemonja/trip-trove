import React, { CSSProperties } from "react";

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

const toFlexGrow = (
  grow: boolean | number | undefined
): CSSProperties["flexGrow"] => {
  if (grow === true) return 1;
  if (typeof grow === "number") return grow;
  return undefined;
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
    style={{
      display: "flex",
      flexDirection: direction,
      flexWrap: wrap ? "wrap" : undefined,
      gap,
      padding,
      justifyContent: justify,
      alignItems: align,
      minHeight: fill ? "100%" : undefined,
      flexGrow: toFlexGrow(grow),
      ...style
    }}
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
  <div
    {...props}
    style={{
      flexGrow: toFlexGrow(grow),
      ...style
    }}
  >
    {children}
  </div>
);
