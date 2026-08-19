import {
  DateInput,
  defaultDatePickerStrings
} from "../../../ui/forms/DateInput";
import { ArrowRight24Regular } from "@fluentui/react-icons";
import { DateRangePickerProps } from "./DateRangePicker.types";
import { Flex } from "../../../ui/Flex";
import { useDateRangePickerStyles } from "./DateRangePicker.styles";

const formatDate = (date?: Date): string => {
  if (!date) return "";
  const month = date.toLocaleString("default", { month: "short" }); //+ 1; // + 1 because 0 indicates the first Month of the Year.
  const day = date.getDate();

  return `${day} ${month}`; //.${year}`;
};

const DateRangePicker: React.FunctionComponent<DateRangePickerProps> = (
  props
) => {
  const styles = useDateRangePickerStyles();

  return (
    <Flex gap={0} direction="row">
      <DateInput
        className={styles.dateInput}
        // DatePicker uses English strings by default. For localized apps, you must override this prop.
        strings={defaultDatePickerStrings}
        // dateTimeFormatter={"MM/yyyy"}
        formatDate={formatDate}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        onChange={props.onStartDateChange}
        minDate={props.minDate}
        maxDate={props.maxDate}
        allowTextInput={props.allowTextInput}
        disabled={props.disable}
        value={props.fromDate ? new Date(props.fromDate) : undefined}
      />
      <div className={styles.arrowContainer}>
        <ArrowRight24Regular aria-label="Compass" className={styles.arrow} />
      </div>
      <DateInput
        className={styles.dateInput}
        // DatePicker uses English strings by default. For localized apps, you must override this prop.
        strings={defaultDatePickerStrings}
        // dateTimeFormatter={"MM/yyyy"}
        formatDate={formatDate}
        placeholder={props.placeholder}
        aria-label={props["aria-label"]}
        onChange={props.onEndDateChange}
        minDate={props.minDate}
        maxDate={props.maxDate}
        allowTextInput={props.allowTextInput}
        disabled={props.disable}
        value={props.toDate ? new Date(props.toDate) : undefined}
      />
    </Flex>
  );
};

export default DateRangePicker;
