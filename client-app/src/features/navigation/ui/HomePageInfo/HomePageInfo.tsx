// Todo move to other file
import { DefaultButton } from '@fluentui/react/lib/Button';
import { mergeStyles } from '@fluentui/react';
import { configData } from '../../../../assets/configData';

const HomePageInfo: React.FunctionComponent = () => {
  const classes = mergeStyles(
    {
      border: "none",
      background: "none"
    }
  );

  return (
    <DefaultButton
      text={configData.APPLICATION_NAME}
      href={"/"}
      iconProps={{ iconName: 'Train' }}
      className={classes}
    />
  );
};

export default HomePageInfo;