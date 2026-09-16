import { SelectChoice } from "../../../ui/forms/SelectField";
import { AutocompleteSuggestion } from "../../../search/AutocompleteController";

export interface ListHeaderProps {
  /**
   * Text to display as the header
   */
  text: string;

  showSearchBar: boolean;
  /**
   * Callback function for when the typed input for the SearchBox has changed.
   */
  onSearchTyped?: (newValue: string) => void;

  /**
   * Callback issued when the selected option changes.
   */
  onSortOptionChange: (
    event: React.FormEvent<HTMLElement>,
    choice?: SelectChoice,
    inputValue?: string
  ) => void;

  /**
   * Options for the order dropdown.
   */
  sortOptions: SelectChoice[];

  selectedSortValue?: string | number;

  items: AutocompleteSuggestion[];

  onFindItem: (id: AutocompleteSuggestion["id"]) => void;

  setItems: (suggestions: AutocompleteSuggestion[]) => void;
}
