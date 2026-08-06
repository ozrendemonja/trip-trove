import { useMemo, useState } from "react";

interface BooleanStateActions {
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
}

export const useBooleanState = (initialValue: boolean) => {
  const [value, setValue] = useState(initialValue);
  const actions: BooleanStateActions = useMemo(
    () => ({
      setTrue: () => setValue(true),
      setFalse: () => setValue(false),
      toggle: () => setValue((current) => !current)
    }),
    []
  );

  return [value, actions] as const;
};
