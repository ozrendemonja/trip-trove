import { Text, tokens } from "@fluentui/react-components";
import {
  NavigationEntry,
  NavigationMenu,
  NavigationSection
} from "./NavigationMenu";
import { navLinkGroups } from "./Navigation.config";
import { useClasses } from "./Navigation.styles";
import CurrentUserInfo from "./ui/current-user-info/CurrentUserInfo";
import { CurrentUserInfoProps } from "./ui/current-user-info/CurrentUserInfo.types";
import HomePageInfo from "./ui/home-page-info/HomePageInfo";
import { useNavigate } from "react-router";
import { useBooleanState } from "../hooks/useBooleanState";
import { Flex } from "../ui/Flex";

// Todo replace when add Redux
const examplePersona: CurrentUserInfoProps = {
  imageUrl: undefined,
  imageInitials: "AL",
  text: "Annie Lindqvist",
  secondaryText: "asdas_asdsa-fdsf@gmail.com",
  imageAlt: "Annie Lindqvist"
};

const renderSectionHeader = (section: NavigationSection): JSX.Element => {
  return (
    <Text as="span" className="navigationHeaders" block>
      {section.label}
    </Text>
  );
};

export const Navigation: React.FunctionComponent = () => {
  const classes = useClasses();
  const [expanded, { toggle: toggleExpanded }] = useBooleanState(false);
  const navigate = useNavigate();

  const handleActivate = (
    event: React.MouseEvent<HTMLElement>,
    entry: NavigationEntry
  ): void => {
    event.preventDefault();

    if (entry.toggleOnly) {
      toggleExpanded();
    } else {
      navigate(entry.path);
    }
  };

  return (
    <Flex gap={15} className={classes.container}>
      <HomePageInfo className={classes.homePageInfo} />
      <NavigationMenu
        renderSectionHeader={renderSectionHeader}
        onActivate={handleActivate}
        aria-label="Navigation menu"
        sections={navLinkGroups(expanded)}
        className={classes.nav}
      />
      <CurrentUserInfo
        {...{
          ...examplePersona,
          initialsColor: tokens.colorBrandBackground,
          initialsTextColor: tokens.colorNeutralForegroundOnBrand
        }}
      />
    </Flex>
  );
};

export default Navigation;
