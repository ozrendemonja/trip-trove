import type { CSSProperties } from "react";

export const getAvatarStyle = (
  size: number,
  backgroundColor?: string,
  color?: string
): CSSProperties => ({
  width: size,
  height: size,
  backgroundColor,
  color
});
