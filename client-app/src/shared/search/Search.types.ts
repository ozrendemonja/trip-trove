import { AutocompleteSuggestion } from "./AutocompleteController";

export interface SearchProps<
  TSuggestion extends AutocompleteSuggestion = AutocompleteSuggestion
> {
  /**
   * Callback function for when the typed input for the SearchBox has changed.
   */
  onSearchTyped?: (newValue: string) => void;

  /**
   * CSS class to apply to the SearchBox.
   */
  className?: string;

  items: TSuggestion[];

  onFindItem: (id: TSuggestion["id"]) => void;

  setItems: (suggestions: TSuggestion[]) => void;
}
