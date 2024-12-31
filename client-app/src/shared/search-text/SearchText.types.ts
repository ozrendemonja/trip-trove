import { Suggestion } from "../../features/continent/domain/Suggestion.types.";

export interface SearchTextProps {
  /**
   * Label displayed above the text field (and read by screen readers).
   */
  label: string;

  placeholder: string;

  required: boolean;

  onSelectItem: (id: number | undefined) => void;

  getSuggestions: (query: string) => Promise<Suggestion[]>;

  /**
   * Function used to determine whether the input value is valid and get an error message if not.
   * Mutually exclusive with the static string `errorMessage` (it will take precedence over this).
   *
   * When it returns `string | JSX.Element`:
   * - If valid, it returns empty string.
   * - If invalid, it returns the error message and the text field will
   *   show a red border and show an error message below the text field.
   *
   * When it returns `Promise<string | JSX.Element>`:
   * - The resolved value is displayed as the error message.
   * - If rejected, the value is thrown away.
   */
  onGetErrorMessage?: (
    value: string
  ) => string | JSX.Element | PromiseLike<string | JSX.Element> | undefined;
}
