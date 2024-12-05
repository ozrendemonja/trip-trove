import { mergeStyleSets } from "@fluentui/react";

const useClasses = () => mergeStyleSets({
    container: { width: 200, border: '1px solid #eee', padding: 10 },
    homePageInfo: {
        border: "none",
        background: "none",
        selectors: {
            ':hover, :focus': {
                backgroundColor: "transparent"
            },
        }
    },
    nav: {
        width: 180,
        maxHeight: 400,
        boxSizing: 'border-box',
        overflowY: 'auto',
        selectors: {
            '& .navigationHeaders': {
                marginLeft: "5px",
                fontWeight: 600
            },
        }
    },
    chevronButton: {
        right: 0,
        left: 'none',
    },
});

export default useClasses;