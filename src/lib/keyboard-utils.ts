import { useEffect, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export function formatShortcut(shortcut: string): string {
  if (isMac) {
    return shortcut
      .replace("Ctrl", "⌘")
      .replace("Alt", "⌥")
      .replace("Shift", "⇧");
  }
  return shortcut;
}

export function useKeyboardShortcut(keyMap: KeyMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Get modifier keys state
      const ctrl = event.ctrlKey || event.metaKey;
      const alt = event.altKey;
      const shift = event.shiftKey;

      // Create shortcut string (e.g., "Ctrl+Shift+P")
      const shortcut = [
        ctrl ? "Ctrl" : "",
        alt ? "Alt" : "",
        shift ? "Shift" : "",
        event.key.toUpperCase(),
      ]
        .filter(Boolean)
        .join("+");

      // Check if we have a handler for this shortcut
      const handler = keyMap[shortcut];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    },
    [keyMap]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Common keyboard shortcuts
export const commonShortcuts: Record<string, string> = {
  "Ctrl+K": "Open Search",
  "Ctrl+P": "Open Profile",
  "Ctrl+H": "Go Home",
  "Ctrl+J": "View Jobs",
  "Ctrl+D": "Open Dashboard",
  "Ctrl+N": "New Job Post",
  "Ctrl+S": "Save Changes",
  "Ctrl+Enter": "Submit Form",
  Esc: "Close Modal",
};

// Helper to generate aria labels for shortcuts
export function getAriaLabel(action: string, shortcut: string): string {
  return `${action} (${formatShortcut(shortcut)})`;
}
