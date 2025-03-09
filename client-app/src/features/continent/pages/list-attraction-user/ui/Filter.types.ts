interface Filter {
  has: (value: string) => boolean;
  onClick: (filterValue: string) => void;
}

export interface FilterProps {
  countrywide: Filter;
  mustVisit: Filter;
  traditional: Filter;
  category: Filter;
  type: Filter;

  /**
   * If provided, additional class name to provide on the root element.
   */
  className?: string;
}
