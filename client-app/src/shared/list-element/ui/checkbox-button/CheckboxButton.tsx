import { Button, tokens } from "@fluentui/react-components";
import {
  CheckboxChecked24Regular,
  CheckboxUnchecked24Regular
} from "@fluentui/react-icons";
import { Flex } from "../../../ui/Flex";
import { CheckboxButtonProps } from "./CheckboxButton.types";

const CheckboxButton: React.FunctionComponent<CheckboxButtonProps> = (
  props
) => {
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
        style={{
          color: tokens.colorBrandBackground,
          fontSize: tokens.fontSizeBase600
        }}
      />
    </Flex>
  );
};

export default CheckboxButton;
