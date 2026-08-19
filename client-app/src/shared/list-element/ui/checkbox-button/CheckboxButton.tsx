import { Button } from "@fluentui/react-components";
import {
  CheckboxChecked24Regular,
  CheckboxUnchecked24Regular
} from "@fluentui/react-icons";
import { Flex } from "../../../ui/Flex";
import { useCheckboxButtonStyles } from "./CheckboxButton.styles";
import { CheckboxButtonProps } from "./CheckboxButton.types";

const CheckboxButton: React.FunctionComponent<CheckboxButtonProps> = (
  props
) => {
  const classes = useCheckboxButtonStyles();

  return (
    <Flex gap={15} direction="row">
      <Button
        appearance="subtle"
        icon={
          props.isOptional ? (
            <CheckboxChecked24Regular />
          ) : (
            <CheckboxUnchecked24Regular />
          )
        }
        className={classes.button}
      />
    </Flex>
  );
};

export default CheckboxButton;
