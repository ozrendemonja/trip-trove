// Todo move to other file
import { DefaultButton } from '@fluentui/react/lib/Button';
import { configData } from '../../../../assets/configData';
import { HomePageInfoProps } from './HomePageInfo.types';

const HomePageInfo: React.FunctionComponent<HomePageInfoProps> = props => {
  return (
    <DefaultButton
      text={configData.APPLICATION_NAME}
      href={"/"}
      iconProps={{ iconName: 'Train' }}
      className={props.className}
    />
  );
};

export default HomePageInfo;