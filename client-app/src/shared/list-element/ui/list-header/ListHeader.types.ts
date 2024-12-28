import { IDropdownOption } from "@fluentui/react";
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
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption,
    index?: number
  ) => void;

  /**
   * Options for the order dropdown.
   */
  sortOptions: IDropdownOption[];

  items: Suggestion[];

  onFindItem: (id: number) => void;
}
