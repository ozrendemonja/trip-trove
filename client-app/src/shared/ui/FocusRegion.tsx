import React from "react";

export interface FocusRegionHandle {
  focus(): void;
}

export const FocusRegion = React.forwardRef<
  FocusRegionHandle,
  React.HTMLAttributes<HTMLDivElement>
>(function FocusRegion({ children, ...props }, focusRegionRef) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(focusRegionRef, () => ({
    focus: () =>
      containerRef.current
        ?.querySelector<HTMLElement>("button, a, input, [tabindex]")
        ?.focus()
  }));

  return (
    <div {...props} ref={containerRef}>
      {children}
    </div>
  );
});
