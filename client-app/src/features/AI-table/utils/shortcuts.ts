// Static keyboard shortcut configuration.
//
// To remap a shortcut, edit the SHORTCUTS map below.
//
// Format: "Ctrl+Alt+Shift+Meta+<Key>"
//   - Modifier order doesn't matter (it gets normalized).
//   - <Key> matches `KeyboardEvent.key`:
//       single chars uppercased ("V", "S", "1"),
//       named keys as-is ("ArrowUp", "Escape", "F2").
//   - Use "" to disable a shortcut.

export type ShortcutAction =
  | "board.mode.edit"
  | "board.mode.plan"
  | "board.mode.review"
  | "board.mode.cycle"
  | "board.export.json"
  | "form.submit";

export const SHORTCUTS: Record<ShortcutAction, string> = {
  "board.mode.edit": "Alt+1",
  "board.mode.plan": "Alt+2",
  "board.mode.review": "Alt+3",
  "board.mode.cycle": "Ctrl+V",
  "board.export.json": "Ctrl+S",
  // Submit a form/input via Enter. Shift+Enter is intentionally NOT mapped
  // here so multiline fields can still insert newlines.
  "form.submit": "Enter"
};

// ----- Internals --------------------------------------------------------

const MODIFIER_ALIASES: Record<string, "Ctrl" | "Alt" | "Shift" | "Meta"> = {
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  meta: "Meta",
  cmd: "Meta",
  command: "Meta"
};

const MODIFIER_ORDER: Array<"Ctrl" | "Alt" | "Shift" | "Meta"> = [
  "Ctrl",
  "Alt",
  "Shift",
  "Meta"
];

// Normalize "ctrl + alt + k" / "Control+Alt+K" / etc. to "Ctrl+Alt+K".
export function normalizeKeyCombo(combo: string): string {
  if (!combo) return "";
  const modifiers = new Set<"Ctrl" | "Alt" | "Shift" | "Meta">();
  let key = "";

  for (const raw of combo.split("+").map((p) => p.trim()).filter(Boolean)) {
    const modifier = MODIFIER_ALIASES[raw.toLowerCase()];
    if (modifier) {
      modifiers.add(modifier);
    } else {
      key = raw.length === 1 ? raw.toUpperCase() : raw;
    }
  }

  if (!key) return "";
  return [...MODIFIER_ORDER.filter((m) => modifiers.has(m)), key].join("+");
}

// Structural type so this works with both DOM `KeyboardEvent` and React's
// `KeyboardEvent<T>` synthetic event without an explicit `.nativeEvent` unwrap.
export interface KeyComboEventLike {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export function keyComboFromEvent(e: KeyComboEventLike): string {
  const key = e.key === " " ? "Space" : e.key;
  // Ignore lone modifier presses.
  if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") {
    return "";
  }

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  parts.push(key);
  return normalizeKeyCombo(parts.join("+"));
}

export function isTypingInFormField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
  return el.isContentEditable;
}

// Pre-normalize once at module load so the keydown handler stays a fast lookup.
const NORMALIZED_SHORTCUTS: Record<ShortcutAction, string> = Object.fromEntries(
  (Object.entries(SHORTCUTS) as [ShortcutAction, string][]).map(([k, v]) => [
    k,
    normalizeKeyCombo(v)
  ])
) as Record<ShortcutAction, string>;

export function getShortcut(action: ShortcutAction): string {
  return NORMALIZED_SHORTCUTS[action];
}

export function isShortcut(action: ShortcutAction, combo: string): boolean {
  const expected = NORMALIZED_SHORTCUTS[action];
  return !!expected && expected === combo;
}
