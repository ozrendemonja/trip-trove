import { SelectChoice } from "../../../ui/forms/SelectField";
import { Suggestion } from "../../../../features/continent/domain/Suggestion.types.";

export interface ListHeaderProps {
  /**
   * Text to display as the header
   */
  text: string;

  showSearchBar: boolean;
  /**
   * Callback function for when the typed input for the SearchBox has changed.
   */
  onSearchTyped?: (
    event?: React.ChangeEvent<HTMLInputElement>,
    newValue?: string
  ) => void;

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

  items: Suggestion[];

  onFindItem: (id: Suggestion["id"]) => void;

  setItems: (suggestions: Suggestion[]) => void;
}
