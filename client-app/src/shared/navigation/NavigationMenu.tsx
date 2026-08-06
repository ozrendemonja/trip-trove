import { Button, Link } from "@fluentui/react-components";
import { ChevronDown20Regular } from "@fluentui/react-icons";
import React, { ReactElement, ReactNode } from "react";

export interface NavigationEntry {
  label: string;
  path: string;
  id?: string;
  icon?: ReactElement;
  items?: NavigationEntry[];
  expanded?: boolean;
  toggleOnly?: boolean;
}

export interface NavigationSection {
  label?: string;
  items: NavigationEntry[];
}

interface NavigationMenuProps {
  sections?: NavigationSection[];
  "aria-label"?: string;
  className?: string;
  renderSectionHeader?: (section: NavigationSection) => ReactNode;
  onActivate?: (
    event: React.MouseEvent<HTMLElement>,
    entry: NavigationEntry
  ) => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  sections = [],
  "aria-label": ariaLabel,
  className,
  renderSectionHeader,
  onActivate
}) => {
  const renderEntry = (entry: NavigationEntry, depth = 0): ReactNode => {
    const content = (
      <>
        {entry.icon}
        {entry.label}
      </>
    );
    const style = { paddingInlineStart: 12 + depth * 16 };

    return (
      <React.Fragment key={entry.id ?? `${entry.label}-${entry.path}`}>
        {entry.toggleOnly ? (
          <Button
            appearance="subtle"
            aria-expanded={entry.expanded}
            icon={entry.icon}
            onClick={(event) => onActivate?.(event, entry)}
            style={style}
          >
            {entry.label}
            <ChevronDown20Regular
              aria-hidden="true"
              data-navigation-chevron
              style={{
                transform: entry.expanded ? "rotate(180deg)" : undefined
              }}
            />
          </Button>
        ) : (
          <Link
            href={entry.path}
            onClick={(event) => onActivate?.(event, entry)}
            style={style}
          >
            {content}
          </Link>
        )}
        {entry.expanded &&
          entry.items?.map((child) => renderEntry(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <nav aria-label={ariaLabel} className={className}>
      {sections.map((section, index) => (
        <div key={section.label ?? index}>
          {section.label && renderSectionHeader?.(section)}
          <div>{section.items.map((item) => renderEntry(item))}</div>
        </div>
      ))}
    </nav>
  );
};

export default NavigationMenu;
