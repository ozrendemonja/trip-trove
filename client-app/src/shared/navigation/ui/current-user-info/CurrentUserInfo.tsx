import { Avatar, Button } from "@fluentui/react-components";
import { SignOut24Regular } from "@fluentui/react-icons";
import { CurrentUserInfoProps } from "./CurrentUserInfo.types";
import { Flex } from "../../../ui/Flex";
import { getAvatarStyle } from "./CurrentUserInfo.styles";

const CurrentUserInfo: React.FunctionComponent<CurrentUserInfoProps> = (
  props
) => {
  const avatarSize = props.avatarSize ?? 26;

  return (
    <Flex direction="row" align="center" gap={8}>
      <Flex direction="row" align="center" gap={8}>
        <Avatar
          image={props.imageUrl ? { src: props.imageUrl } : undefined}
          initials={props.imageInitials}
          name={props.text}
          aria-label={props.imageAlt ?? props.text}
          style={getAvatarStyle(
            avatarSize,
            props.initialsColor,
            props.initialsTextColor
          )}
        />
        <div>
          <div>{props.text}</div>
          {props.secondaryText && <div>{props.secondaryText}</div>}
        </div>
      </Flex>
      <Button appearance="subtle" icon={<SignOut24Regular />} />
    </Flex>
  );
};

export default CurrentUserInfo;
