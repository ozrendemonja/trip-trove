import {
  Button,
  makeStyles,
  mergeClasses,
  Spinner
} from "@fluentui/react-components";
import type { ButtonProps } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    minWidth: "120px"
  }
});

export type PendingButtonProps = ButtonProps & {
  pending: boolean;
  pendingText: string;
  spinnerAppearance?: "primary" | "inverted";
};

export const PendingButton: React.FunctionComponent<PendingButtonProps> = ({
  pending,
  pendingText,
  spinnerAppearance,
  disabled,
  icon,
  children,
  className,
  ...buttonProps
}) => {
  const classes = useStyles();

  return (
    <Button
      {...buttonProps}
      className={mergeClasses(classes.root, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-live={pending ? "polite" : undefined}
      icon={
        pending ? <Spinner size="tiny" appearance={spinnerAppearance} /> : icon
      }
    >
      {pending ? pendingText : children}
    </Button>
  );
};
