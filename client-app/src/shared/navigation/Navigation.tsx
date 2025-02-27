import { initializeIcons, Stack, Text, useTheme } from "@fluentui/react";
import { INavLink, INavLinkGroup, Nav } from "@fluentui/react/lib/Nav";
import { useState } from "react";
import { navLinkGroups } from "./Navigation.config";
import { useClasses } from "./Navigation.styles";
import CurrentUserInfo from "./ui/current-user-info/CurrentUserInfo";
import { CurrentUserInfoProps } from "./ui/current-user-info/CurrentUserInfo.types";
import HomePageInfo from "./ui/home-page-info/HomePageInfo";
import { useNavigate } from "react-router";
import { useBoolean } from "@fluentui/react-hooks";

initializeIcons();

// Todo replace when add Redux
const examplePersona: CurrentUserInfoProps = {
  imageUrl: undefined,
  imageInitials: "AL",
  text: "Annie Lindqvist",
  secondaryText: "asdas_asdsa-fdsf@gmail.com",
  imageAlt: "Annie Lindqvist"
};

const onRenderGroupHeader = (group: INavLinkGroup): JSX.Element => {
  return (
    <Text as="span" className="navigationHeaders" block>
      {group.name}
    </Text>
  );
};

export const Navigation: React.FunctionComponent = () => {
  const classes = useClasses();
  const theme = useTheme();
  const [expandLinks, { toggle: toogleExpandLinks }] = useBoolean(false);
  const navigate = useNavigate();

  const onLinkClick = (
    ev?: React.MouseEvent<HTMLElement>,
    item?: INavLink
  ): void => {
    ev?.preventDefault();

    if (item?.blockCallToUrl) {
      toogleExpandLinks();
    } else {
      navigate(item?.url!);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 15 }} className={classes.container}>
      <HomePageInfo className={classes.homePageInfo} />
      <Nav
        onRenderGroupHeader={onRenderGroupHeader}
        onLinkClick={onLinkClick}
        selectedKey="navigation-key"
        ariaLabel="Navigation menu"
        groups={navLinkGroups(expandLinks)}
        className={classes.nav}
      />
      <CurrentUserInfo
        {...{
          ...examplePersona,
          initialsColor: theme.palette.orange,
          initialsTextColor: theme.palette.white
        }}
      />
    </Stack>
  );
};

export default Navigation;
