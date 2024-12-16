import { mergeStyleSets } from "@fluentui/react";

export const useClasses = () => mergeStyleSets({
    root: {
        margin: "50px",
        width: "100%",
        height: "100%",
        selectors: {
            "& .ms-Spinner-circle": {
                borderWidth: "3px",
                width: "128px",
                height: "128px",
            }
        },
    },
})