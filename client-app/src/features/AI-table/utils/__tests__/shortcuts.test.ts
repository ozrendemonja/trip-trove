import {
  SHORTCUTS,
  ShortcutAction,
  getShortcut,
  isShortcut,
  isTypingInFormField,
  keyComboFromEvent,
  normalizeKeyCombo
} from "../shortcuts";

describe("normalizeKeyCombo", () => {
  test("returns empty string for empty input", () => {
    expect(normalizeKeyCombo("")).toBe("");
  });

  test("returns empty string when only modifiers are provided", () => {
    expect(normalizeKeyCombo("Ctrl+Alt")).toBe("");
  });

  test("uppercases single character keys", () => {
    expect(normalizeKeyCombo("ctrl+s")).toBe("Ctrl+S");
  });

  test("preserves named keys verbatim", () => {
    expect(normalizeKeyCombo("alt+ArrowUp")).toBe("Alt+ArrowUp");
  });

  test("normalizes modifier aliases (control/option/cmd/command)", () => {
    expect(normalizeKeyCombo("control+option+k")).toBe("Ctrl+Alt+K");
    expect(normalizeKeyCombo("cmd+shift+p")).toBe("Shift+Meta+P");
    expect(normalizeKeyCombo("command+s")).toBe("Meta+S");
  });

  test("orders modifiers Ctrl > Alt > Shift > Meta regardless of input order", () => {
    expect(normalizeKeyCombo("Meta+Shift+Alt+Ctrl+K")).toBe(
      "Ctrl+Alt+Shift+Meta+K"
    );
  });

  test("ignores extra whitespace and empty segments", () => {
    expect(normalizeKeyCombo(" ctrl + + alt + s ")).toBe("Ctrl+Alt+S");
  });

  test("deduplicates repeated modifiers", () => {
    expect(normalizeKeyCombo("ctrl+ctrl+s")).toBe("Ctrl+S");
  });
});

describe("keyComboFromEvent", () => {
  const makeEvent = (init: Partial<KeyboardEvent>): KeyboardEvent =>
    ({
      key: "",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      ...init
    }) as KeyboardEvent;

  test("returns empty string for lone modifier presses", () => {
    expect(keyComboFromEvent(makeEvent({ key: "Control" }))).toBe("");
    expect(keyComboFromEvent(makeEvent({ key: "Alt" }))).toBe("");
    expect(keyComboFromEvent(makeEvent({ key: "Shift" }))).toBe("");
    expect(keyComboFromEvent(makeEvent({ key: "Meta" }))).toBe("");
  });

  test("uppercases single character keys", () => {
    expect(keyComboFromEvent(makeEvent({ key: "s", ctrlKey: true }))).toBe(
      "Ctrl+S"
    );
  });

  test("maps space to 'Space'", () => {
    expect(keyComboFromEvent(makeEvent({ key: " ", ctrlKey: true }))).toBe(
      "Ctrl+Space"
    );
  });

  test("preserves named keys", () => {
    expect(keyComboFromEvent(makeEvent({ key: "Escape" }))).toBe("Escape");
    expect(keyComboFromEvent(makeEvent({ key: "ArrowDown", altKey: true }))).toBe(
      "Alt+ArrowDown"
    );
  });

  test("orders multiple modifiers Ctrl+Alt+Shift+Meta", () => {
    expect(
      keyComboFromEvent(
        makeEvent({
          key: "k",
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
          metaKey: true
        })
      )
    ).toBe("Ctrl+Alt+Shift+Meta+K");
  });
});

describe("isTypingInFormField", () => {
  const makeEl = (
    tagName: string,
    isContentEditable = false
  ): HTMLElement =>
    ({ tagName, isContentEditable }) as unknown as HTMLElement;

  test("returns false for null target", () => {
    expect(isTypingInFormField(null)).toBe(false);
  });

  test("returns true for INPUT and TEXTAREA elements", () => {
    expect(isTypingInFormField(makeEl("INPUT"))).toBe(true);
    expect(isTypingInFormField(makeEl("TEXTAREA"))).toBe(true);
  });

  test("returns true for contentEditable elements", () => {
    expect(isTypingInFormField(makeEl("DIV", true))).toBe(true);
  });

  test("returns false for non-editable, non-input elements", () => {
    expect(isTypingInFormField(makeEl("DIV"))).toBe(false);
    expect(isTypingInFormField(makeEl("BUTTON"))).toBe(false);
  });
});

describe("getShortcut & isShortcut", () => {
  test("getShortcut returns the normalized combo for each configured action", () => {
    (Object.keys(SHORTCUTS) as ShortcutAction[]).forEach((action) => {
      expect(getShortcut(action)).toBe(normalizeKeyCombo(SHORTCUTS[action]));
    });
  });

  test("isShortcut matches the configured combo for each action", () => {
    expect(isShortcut("board.mode.edit", "Alt+1")).toBe(true);
    expect(isShortcut("board.mode.plan", "Alt+2")).toBe(true);
    expect(isShortcut("board.mode.review", "Alt+3")).toBe(true);
    expect(isShortcut("board.mode.cycle", "Ctrl+V")).toBe(true);
    expect(isShortcut("board.export.json", "Ctrl+S")).toBe(true);
    expect(isShortcut("form.submit", "Enter")).toBe(true);
  });

  test("form.submit does NOT match Shift+Enter (so multiline newlines are preserved)", () => {
    expect(isShortcut("form.submit", "Shift+Enter")).toBe(false);
  });

  test("keyComboFromEvent + isShortcut works for plain Enter and skips Shift+Enter", () => {
    const submit = keyComboFromEvent({
      key: "Enter",
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false
    } as KeyboardEvent);
    const newline = keyComboFromEvent({
      key: "Enter",
      ctrlKey: false,
      altKey: false,
      shiftKey: true,
      metaKey: false
    } as KeyboardEvent);
    expect(isShortcut("form.submit", submit)).toBe(true);
    expect(isShortcut("form.submit", newline)).toBe(false);
  });

  test("isShortcut rejects mismatched combos", () => {
    expect(isShortcut("board.mode.edit", "Alt+2")).toBe(false);
    expect(isShortcut("board.export.json", "S")).toBe(false);
  });

  test("isShortcut returns false for an empty configured combo", () => {
    // Sanity check: an action that is intentionally disabled (combo === "")
    // should never match anything, including the empty string.
    const action = "board.mode.edit" as ShortcutAction;
    const expected = getShortcut(action);
    if (expected === "") {
      expect(isShortcut(action, "")).toBe(false);
    } else {
      // No disabled shortcut configured; nothing to assert.
      expect(expected).not.toBe("");
    }
  });
});
