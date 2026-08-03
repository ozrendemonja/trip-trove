import { RefObject, useEffect, useState } from "react";

interface Focusable {
  focus(): void;
}

interface UseSaveErrorOptions<T extends Focusable> {
  nameConflictMessage: string;
  saveErrorMessage: string;
  focusRef: RefObject<T | null>;
  resetKey: unknown;
}

export const getApiErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const cause = "cause" in error ? error.cause : undefined;
  const apiError = cause && typeof cause === "object" ? cause : error;

  return "errorCode" in apiError && typeof apiError.errorCode === "string"
    ? apiError.errorCode
    : undefined;
};

export const useSaveError = <T extends Focusable>({
  nameConflictMessage,
  saveErrorMessage,
  focusRef,
  resetKey
}: UseSaveErrorOptions<T>) => {
  const [nameConflict, setNameConflict] = useState<string>();
  const [saveError, setSaveError] = useState<string>();

  useEffect(() => {
    setNameConflict(undefined);
  }, [resetKey]);

  useEffect(() => {
    if (nameConflict) {
      focusRef.current?.focus();
    }
  }, [focusRef, nameConflict]);

  const handleSaveError = (error: unknown): void => {
    if (getApiErrorCode(error) === "NAME_CONFLICT") {
      setNameConflict(nameConflictMessage);
      setSaveError(undefined);
      return;
    }

    setSaveError(saveErrorMessage);
    setNameConflict(undefined);
  };

  const clearSaveErrors = (): void => {
    setNameConflict(undefined);
    setSaveError(undefined);
  };

  return { nameConflict, saveError, handleSaveError, clearSaveErrors };
};
