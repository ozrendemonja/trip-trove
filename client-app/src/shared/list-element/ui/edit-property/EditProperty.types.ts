import type React from "react";

export interface EditPropertyProps {
  /**
   * Text to display as the header
   */
  text: string;

  editIconAriaLabel: string;

  isFormValid: boolean;

  children: React.ReactNode;

  editIcon?: React.ReactElement;

  onUpdateClick: () => Promise<void | boolean>;

  /**
   * Message shown when the API rejects an update with NAME_CONFLICT.
   */
  conflictErrorMessage?: string;

  /**
   * Fallback shown when an update fails for another reason.
   */
  saveErrorMessage?: string;

  /**
   * Clears the submit error when this value changes.
   */
  submitErrorResetKey?: unknown;

  /**
   * Clears the submit error when this value changes.
   */
  submitErrorResetKey?: unknown;

  /**
   * Controlled mode: when provided, the edit trigger is not rendered.
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
