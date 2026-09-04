import { Button, mergeClasses } from "@fluentui/react-components";
import React, { useEffect, useRef, useState } from "react";
import { FocusRegion, FocusRegionHandle } from "../ui/FocusRegion";
import { useAutocompleteClasses } from "./Autocomplete.styles";
import {
  AutocompleteController,
  AutocompleteSuggestion
} from "./AutocompleteController";

export interface AutocompleteInputProps {
  readonly query: string;
  readonly hasSelectedSuggestion: boolean;
  readonly onQueryChange: (query: string) => void;
  readonly onKeyDown: React.KeyboardEventHandler<HTMLElement>;
}

export interface AutocompleteProps<TSuggestion extends AutocompleteSuggestion> {
  readonly controller: AutocompleteController<TSuggestion>;
  readonly suggestions?: readonly TSuggestion[];
  readonly getSuggestions?: (query: string) => Promise<TSuggestion[]>;
  readonly renderInput: (props: AutocompleteInputProps) => React.ReactNode;
  readonly onSuggestionSelected: (suggestion: TSuggestion) => void;
  readonly dropdownClassName?: string;
  readonly suggestionClassName?: string;
}

export const Autocomplete = <TSuggestion extends AutocompleteSuggestion>(
  props: AutocompleteProps<TSuggestion>
): React.ReactElement => {
  const {
    controller,
    suggestions: controlledSuggestions,
    getSuggestions,
    renderInput,
    onSuggestionSelected,
    dropdownClassName,
    suggestionClassName
  } = props;
  const classes = useAutocompleteClasses();
  const focusRegionRef = useRef<FocusRegionHandle>(null);
  const [snapshot, setSnapshot] = useState(() =>
    controlledSuggestions
      ? controller.showSuggestions(controlledSuggestions)
      : controller.snapshot
  );

  useEffect(() => {
    if (controlledSuggestions) {
      setSnapshot(controller.showSuggestions(controlledSuggestions));
    }
  }, [controller, controlledSuggestions]);

  useEffect(() => {
    if (!getSuggestions) {
      return;
    }

    const request = controller.requestSuggestions();
    if (!request) {
      return;
    }

    let cancelled = false;
    void getSuggestions(request.query).then(
      (suggestions) => {
        if (cancelled) {
          return;
        }

        const nextSnapshot = controller.resolveSuggestions(
          request,
          suggestions
        );
        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      },
      () => {
        if (cancelled) {
          return;
        }

        const nextSnapshot = controller.resolveSuggestions(request, []);
        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [
    controller,
    getSuggestions,
    snapshot.hasSelectedSuggestion,
    snapshot.query
  ]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key === "ArrowDown") {
      focusRegionRef.current?.focus();
    }
  };

  return (
    <>
      {renderInput({
        query: snapshot.query,
        hasSelectedSuggestion: snapshot.hasSelectedSuggestion,
        onQueryChange: (query) => setSnapshot(controller.type(query)),
        onKeyDown: handleKeyDown
      })}
      <FocusRegion
        ref={focusRegionRef}
        role="grid"
        className={mergeClasses(classes.dropdown, dropdownClassName)}
      >
        {snapshot.suggestions.map((suggestion) => (
          <Button
            key={`${suggestion.value}-${suggestion.id}`}
            role="menuitem"
            appearance="secondary"
            className={mergeClasses(classes.suggestion, suggestionClassName)}
            aria-label={suggestion.value}
            onFocus={() => setSnapshot(controller.focusSuggestion(suggestion))}
            onClick={() => {
              setSnapshot(controller.selectSuggestion(suggestion));
              onSuggestionSelected(suggestion);
            }}
          >
            {suggestion.value}
          </Button>
        ))}
      </FocusRegion>
    </>
  );
};
