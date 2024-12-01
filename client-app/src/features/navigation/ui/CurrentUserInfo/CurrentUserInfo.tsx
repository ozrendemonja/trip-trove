import { getTheme, IconButton } from '@fluentui/react';
import { Persona, PersonaPresence } from '@fluentui/react/lib/Persona';
import { Stack } from '@fluentui/react/lib/Stack';
import { CurrentUserInfoProps } from './CurrentUserInfo.types';

const CurrentUserInfo: React.FunctionComponent<CurrentUserInfoProps> = props => {
  const theme = getTheme();

  return (
    <Stack horizontal={true} >
      <Persona
        {...props}
        presence={PersonaPresence.none}
        initialsColor={theme.palette.orange}
        initialsTextColor={theme.palette.white}
        showInitialsUntilImageLoads={true}
        coinSize={props.coinSize ?? 26}
      />
      <IconButton iconProps={{ iconName: "SignOut" }} />
    </Stack>
  );
};

export default CurrentUserInfo;