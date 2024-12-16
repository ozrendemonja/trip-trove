import { Spinner, SpinnerSize } from "@fluentui/react";
import { useClasses } from "./LoadingSpinner.styles";
import { LoadingSpinnerProps } from "./LoadingSpinner.types";

export const LoadingSpinner: React.FunctionComponent<LoadingSpinnerProps> = props => {
    const classes = useClasses();
    return (
        <Spinner size={SpinnerSize.large} role="main" label={props.text} ariaLive="assertive" labelPosition="bottom" className={classes.root} />
    );
}
