import { number } from "yup";

export interface EditPropertyProps {
  /**
   * Text to display as the header
   */
  text: string;

  onUpdateClick: () => void;
}

export interface EditPropertyCountryDetailsProps {
  /**
   * Text to display as the header
   */
  text: string;

  countryId: number;

  onUpdateClick: () => void;
}
