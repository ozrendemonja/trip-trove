import { Icon, Link } from "@fluentui/react";
import { useClasses } from "./Filter.styles";
import { FilterElementProps } from "./FilterElement.types";

export const FilterElement: React.FunctionComponent<FilterElementProps> = (
  props
) => {
  const classes = useClasses();
  return (
    <Link
      className={
        props.isSelected
          ? classes.filterElementSelected
          : classes.filterElementNotSelected
      }
      onClick={props.onClick}
    >
      {props.children}
      {props.isSelected && (
        <Icon className={classes.filterElementClearIcon} iconName="Clear" />
      )}
    </Link>
  );
};
