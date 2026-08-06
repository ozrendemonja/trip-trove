export type Period = {
  from: string;
  to: string;
};

export type DateRangePickerProps = {
  placeholder?: string;
  "aria-label"?: string;
  value?: Period;
  onStartDateChange?: (date: Date | null | undefined) => void;
  onEndDateChange?: (date: Date | null | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  allowTextInput?: boolean;
  fromDate?: string;
  toDate?: string;
  disable: boolean;
};
