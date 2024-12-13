import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
    const theme = useTheme();

    return mergeStyleSets({
        // TODO Repeating
        root: {
            marginLeft: "100px",
            padding: '12px',
            height: "90vh",
            maxHeight: "1200px",
            maxWidth: "1200px",
            borderRadius: "30px",
            background: theme.palette.white,
            display: "flex",
            flexDirection: "column"
        },
        header: {
            fontSize: "30px",
            marginLeft: "25px",
            marginTop: "5px",
            fontWeight: "600"
        },
        footer: {
            display: "flex"
        }
    });
};