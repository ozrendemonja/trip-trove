import { Dismiss24Regular } from "@fluentui/react-icons";
import { Link } from "@fluentui/react-components";
import { useClasses } from "./Filter.styles";
import { FilterElementProps } from "./FilterElement.types";

export const FilterElement: React.FunctionComponent<FilterElementProps> = (
  props
) => {
  const classes = useClasses();
  return (
    <Link
      data-fluent-link
      className={
        props.isSelected
          ? classes.filterElementSelected
          : classes.filterElementNotSelected
      }
      onClick={props.onClick}
    >
      {props.children}
      {props.isSelected && (
        <Dismiss24Regular
          className={classes.filterElementClearIcon}
          data-icon-name="Clear"
        />
      )}
    </Link>
  );
};
