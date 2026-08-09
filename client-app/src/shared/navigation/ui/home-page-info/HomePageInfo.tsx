import { Button } from "@fluentui/react-components";
import { VehicleSubway24Regular } from "@fluentui/react-icons";
import { useNavigate } from "react-router";
import { configData } from "../../../../assets/ConfigData";
import { HomePageInfoProps } from "./HomePageInfo.types";

const HomePageInfo: React.FunctionComponent<HomePageInfoProps> = (props) => {
  const navigate = useNavigate();

  return (
    <Button
      appearance="secondary"
      onClick={() => navigate("/")}
      icon={<VehicleSubway24Regular />}
      className={props.className}
    >
      {configData.APPLICATION_NAME}
    </Button>
  );
};

export default HomePageInfo;
