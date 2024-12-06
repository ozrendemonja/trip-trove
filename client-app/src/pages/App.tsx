import { MouseEventHandler, useState } from "react";
import { getAllContinents, GetAllContinentsResponse } from "../clients/manager";
import managerClient from "../config/clientsApiConfig";


function App() {
  const [message, setMessage] = useState<GetAllContinentsResponse>();

  const testApiCall = async (onClick?: MouseEventHandler<HTMLButtonElement>): Promise<void> => {
    managerClient();

    const { data, error } = await getAllContinents({
      headers: {
        "x-api-version": "1"
      }
    });
    if (error) {
      console.log(error);
      return;
    }
    setMessage(data);
  };

  return (
    <div className="App">
      <header className="App-header">
        {
          message?.map(continent =>
            <p>{continent.continentName}</p>
          )
        }
        <button onClick={testApiCall}>AAAAAAAAAAAAAAAAAAAAAAAAAAAA</button>
      </header>
    </div>
  );
}

export default App;
