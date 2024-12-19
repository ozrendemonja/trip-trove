import {
  addMonths,
  addYears,
  DatePicker,
  defaultDatePickerStrings,
  FontIcon,
  IDatePickerStyles,
  Stack
} from "@fluentui/react";

const datePickerStyles: Partial<IDatePickerStyles> = {
  root: { width: 100, color: "#fec703", backgroundColor: "white" },
  icon: { color: "#fec703" }
};

const formatDate = (date?: Date): string => {
  if (!date) return "";
  const month = date.toLocaleString("default", { month: "short" }); //+ 1; // + 1 because 0 indicates the first Month of the Year.
  const day = date.getDate();

  return `${day} ${month}`; //.${year}`;
};

const DatePickerMy: React.FunctionComponent = () => {
  const today = new Date(Date.now());
  const minDate = addMonths(today, -1);
  const maxDate = addYears(today, 1);

  return (
    <Stack tokens={{ childrenGap: 0 }} horizontal={true}>
      <DatePicker
        styles={datePickerStyles}
        // DatePicker uses English strings by default. For localized apps, you must override this prop.
        strings={defaultDatePickerStrings}
        // dateTimeFormatter={"MM/yyyy"}
        formatDate={formatDate}
        placeholder="Select a date..."
        ariaLabel="Select a date"
        minDate={minDate}
        maxDate={maxDate}
        allowTextInput
      />
      {/* <Icon iconProps={{ iconName: "ChromeBackMirrored", styles: { root: { color: "#fec703", textAlign: "centre" } } }} /> */}
      <div style={{ padding: "5px" }}>
        <FontIcon
          aria-label="Compass"
          iconName="ChromeBackMirrored"
          style={{
            color: "#fec703",
            position: "relative",
            top: "calc(50% - 10px)"
          }}
        />
      </div>
      <DatePicker
        styles={datePickerStyles}
        // DatePicker uses English strings by default. For localized apps, you must override this prop.
        strings={defaultDatePickerStrings}
        // dateTimeFormatter={"MM/yyyy"}
        formatDate={formatDate}
        placeholder="Select a date..."
        ariaLabel="Select a date"
        minDate={minDate}
        maxDate={maxDate}
        allowTextInput
      />
      {/* <IconButton iconProps={{ iconName: "Checkbox", styles: { root: { color: "#fec703", fontSize: 24 } } }} /> */}
    </Stack>
  );
};

export default DatePickerMy;
