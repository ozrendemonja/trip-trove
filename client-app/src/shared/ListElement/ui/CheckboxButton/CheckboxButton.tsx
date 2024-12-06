import { IconButton, Stack } from "@fluentui/react";
import { CheckboxButtonProps } from "./CheckboxButton.types";

const CheckboxButton: React.FunctionComponent<CheckboxButtonProps> = props => {
    return (
        <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
            <IconButton iconProps={{ iconName: props.isOptional ? "BoxCheckmarkSolid" : "Checkbox", styles: { root: { color: "#fec703", fontSize: 24 } } }} />
        </Stack>
    );
}

export default CheckboxButton;