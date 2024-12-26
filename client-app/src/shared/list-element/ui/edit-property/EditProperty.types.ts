export interface EditPropertyProps {
  /**
   * Text to display as the header
   */
  text: string;

  editIconAriaLabel: string;

  isFormValid: boolean;

  children: React.ReactNode;

  onUpdateClick: () => Promise<void>;
}
