import { Suggestion } from "../../features/continent/domain/Suggestion.types.";

export interface SearchProps {
  /**
   * Callback function for when the typed input for the SearchBox has changed.
   */
  onSearchTyped: (
    event?: React.ChangeEvent<HTMLInputElement>,
    newValue?: string
  ) => void;

  /**
   * CSS class to apply to the SearchBox.
   */
  className?: string;

  items: Suggestion[];

  onFindItem: (id: number) => void;

  setItems: (suggestions: Suggestion[]) => void;
}
