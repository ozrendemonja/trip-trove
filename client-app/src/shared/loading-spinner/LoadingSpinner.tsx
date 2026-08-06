import { Spinner } from "@fluentui/react-components";
import { useClasses } from "./LoadingSpinner.styles";
import { LoadingSpinnerProps } from "./LoadingSpinner.types";

export const LoadingSpinner: React.FunctionComponent<LoadingSpinnerProps> = (
  props
) => {
  const classes = useClasses();
  return (
    <Spinner
      size="huge"
      role="main"
      label={props.text}
      aria-live="assertive"
      labelPosition="below"
      className={classes.root}
    />
  );
};
