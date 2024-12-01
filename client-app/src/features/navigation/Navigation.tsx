import { initializeIcons, Stack, Text } from '@fluentui/react';
import { INavLinkGroup, Nav } from '@fluentui/react/lib/Nav';
import { navLinkGroups } from './Navigation.config';
import CurrentUserInfo from './ui/CurrentUserInfo/CurrentUserInfo';
import { CurrentUserInfoProps } from './ui/CurrentUserInfo/CurrentUserInfo.types';
import HomePageInfo from './ui/HomePageInfo/HomePageInfo';



initializeIcons();

// Todo replace when add Redux 
const examplePersona: CurrentUserInfoProps = {
    imageUrl: undefined,
    imageInitials: 'AL',
    text: 'Annie Lindqvist',
    secondaryText: 'asdas_asdsa-fdsf@gmail.com',
    imageAlt: "Annie Lindqvist"
};

const onRenderGroupHeader = (group: INavLinkGroup): JSX.Element => {
    return <Text as="span" className="navigationHeaders" block>{group.name}</Text>;
}

export const Navigation: React.FunctionComponent = () => {
    return (
        <Stack tokens={{ childrenGap: 15 }} style={{ width: 200, border: '1px solid #eee', padding: 10 }}>
            <HomePageInfo />
            <Nav
                onRenderGroupHeader={onRenderGroupHeader}
                selectedKey="key3"
                ariaLabel="Nav basic example"
                groups={navLinkGroups}
            />
            <CurrentUserInfo {...examplePersona} />
        </Stack>
    );
};

export default Navigation;