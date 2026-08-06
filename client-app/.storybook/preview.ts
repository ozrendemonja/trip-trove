import { FluentProvider } from "@fluentui/react-components";
import type { Preview } from "@storybook/react";
import { createElement } from "react";
import { appTheme } from "../src/shared/fluent/AppTheme";

let focusPrototypeReadGuarded = false;

const guardInstrumentedFocusPrototypeRead = (): void => {
  if (focusPrototypeReadGuarded || typeof HTMLElement === "undefined") return;

  const prototype = HTMLElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "focus");
  if (!descriptor?.get || !descriptor.set || typeof document === "undefined") {
    return;
  }

  const instrumentedGet = descriptor.get;
  const instrumentedSet = descriptor.set;
  let currentFocus = instrumentedGet.call(document.body) as HTMLElement["focus"];

  // Storybook 10.5's accessor throws when keyborg reads focus from the
  // prototype. This mirrors the merged upstream fix until it is published.
  Object.defineProperty(prototype, "focus", {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get() {
      if (this === prototype) return currentFocus;
      try {
        return instrumentedGet.call(this);
      } catch {
        return currentFocus;
      }
    },
    set(newFocus: HTMLElement["focus"]) {
      currentFocus = newFocus;
      instrumentedSet.call(this, newFocus);
    }
  });
  focusPrototypeReadGuarded = true;
};

const preview: Preview = {
  decorators: [
    (Story) => {
      guardInstrumentedFocusPrototypeRead();
      return createElement(
        FluentProvider,
        { theme: appTheme, style: { backgroundColor: "transparent" } },
        createElement(Story)
      );
    }
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
