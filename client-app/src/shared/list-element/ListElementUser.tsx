import { initializeIcons } from "@fluentui/react";
import {
  CheckboxVisibility,
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode
} from "@fluentui/react/lib/DetailsList";
import React from "react";
import { useClasses } from "./ListElement.styles";
import { ListElementUserProps } from "./ListElement.types";

initializeIcons();

export const ListElementUser: React.FunctionComponent<ListElementUserProps> = (
  props
) => {
  const classes = useClasses();
  const sortedItems = props.items;
  const columns = props.columns;

  return (
    <DetailsList
      className={classes.listBody}
      setKey={`Attractions-DetailsList`}
      items={sortedItems ?? []}
      columns={columns}
      checkboxVisibility={CheckboxVisibility.hidden}
      layoutMode={DetailsListLayoutMode.justified}
      isHeaderVisible={true}
      selectionMode={SelectionMode.none}
      constrainMode={ConstrainMode.horizontalConstrained}
      ariaLabelForListHeader="Column attraction headers"
      onRenderMissingItem={props.onRenderMissingItem}
      onRenderItemColumn={props.onRenderItemColumn}
      ariaLabelForGrid="Item details"
    />
  );
};

export default ListElementUser;
