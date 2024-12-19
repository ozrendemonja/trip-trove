export interface ListHeaderProps {
  /**
   * Text to display as the header
   */
  text: string;
  /**
   * Callback function for when the typed input for the SearchBox has changed.
   */
  onSearchTyped?: (
    event?: React.ChangeEvent<HTMLInputElement>,
    newValue?: string
  ) => void;
}
