import { useEffect, useRef } from "react";
import {
  isShortcut,
  keyComboFromEvent
} from "../../features/AI-table/utils/Shortcuts";

/**
 * Registers a window-level handler for the "form.save" shortcut (Ctrl/Cmd+S)
 * that runs `onSave` whenever the combo is pressed and `enabled` is true.
 *
 * Behaviour:
 *  - The browser's native "save page" dialog is always prevented while active.
 *  - The event is captured and its propagation stopped, so a page that also
 *    binds Ctrl+S on `window` (e.g. the Board's export-JSON shortcut) does not
 *    fire at the same time when a save form/dialog is on screen.
 *  - No listener is attached while `enabled` is false, so closed dialogs and
 *    invalid forms don't register global handlers.
 *
 * `onSave` is kept in a ref so it can change on every render (e.g. because it
 * closes over form state) without re-registering the listener.
 */
export function useSaveShortcut(onSave: () => void, enabled = true): void {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isShortcut("form.save", keyComboFromEvent(event))) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onSaveRef.current();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled]);
}
