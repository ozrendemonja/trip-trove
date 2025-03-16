import { Period } from "../../../../features/continent/pages/add-attraction/AddAttraction.types";

export type DateRangePickerProps {
  placeholder?: string;
  ariaLabel?: string;
  value?: Period;
  onSelectStartDate?: (date: Date | null | undefined) => void;
  onSelectEndDate?: (date: Date | null | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  allowTextInput?: boolean;
  fromDate?: string;
  toDate?: string;
  disable: boolean;
}