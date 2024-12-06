import { mergeStyleSets, useTheme } from "@fluentui/react";

export const useClasses = () => {
    const theme = useTheme();

    return mergeStyleSets({
        root: {
            marginLeft: "100px",
            padding: '12px',
            maxHeight: "1200px",
            maxWidth: "1200px",
            borderRadius: "30px",
            background: theme.palette.white,
        },
        listBody: {
            maxHeight: "600px",
            maxWidth: "1200px",
            selectors: {
                "& .ms-Check-circle": {
                    borderRadius: "50%"
                }
            },
        }
    });
};