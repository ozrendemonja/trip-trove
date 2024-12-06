import { IconButton, Stack, Text } from "@fluentui/react";
import { EditPropertyProps } from "./EditProperty.types";

const EditProperty: React.FunctionComponent<EditPropertyProps> = props => {
    return (
        <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
            <Text>{props.text}</Text>
            <IconButton iconProps={{ iconName: "Edit", styles: { root: { color: "#fec703" } } }} />
            {props.isOptional && <IconButton iconProps={{ iconName: "Delete", styles: { root: { color: "red" } } }} />}
        </Stack>
    );
}

export default EditProperty;