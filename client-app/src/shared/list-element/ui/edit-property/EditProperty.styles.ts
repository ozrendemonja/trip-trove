import { FontWeights, mergeStyleSets } from "@fluentui/react";

export const useClasses = () => {
  return mergeStyleSets({
    modalContainer: {
      minWidth: "700px",
      borderRadius: "30px"
    },
    header: {
      padding: "12px 12px 14px 24px"
    },
    heading: {
      fontWeight: FontWeights.semibold,
      fontSize: "30px",
      margin: "0"
    },
    form: {
      maxWidth: "600px",
      marginLeft: "25px"
    },
    editIcon: {
      color: "#fec703"
    },
    editDialog: {
      height: "90px"
    },
    footer: {
      padding: "24px 5px",
      marginTop: "16px",
      marginRight: "16px"
    },
    closeIcon: {
      color: "blue",
      marginLeft: "auto",
      marginTop: "4px",
      marginRight: "2px"
    }
  });
};
