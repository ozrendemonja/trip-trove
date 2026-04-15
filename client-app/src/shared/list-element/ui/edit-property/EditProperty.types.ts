export interface EditPropertyProps {
  /**
   * Text to display as the header
   */
  text: string;

  editIconAriaLabel: string;

  isFormValid: boolean;

  children: React.ReactNode;

  editIconName?: string;

  onUpdateClick: () => Promise<void>;

  /**
   * Controlled mode: when provided the trigger IconButton is not rendered.
   */
  isOpen?: boolean;

  /**
   * Called when the modal should close (Cancel or X). Required in controlled mode.
   */
  onDismiss?: () => void;

  /**
   * Custom modal title. Defaults to "Modifying {text}".
   */
  title?: string;

  /**
   * Custom submit button text. Defaults to "Update".
   */
  submitText?: string;
}
