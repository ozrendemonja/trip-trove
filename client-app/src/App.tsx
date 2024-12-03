import "./styles.css"
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState<any>("")

  useEffect(() => {
    async function fetchMyAPI() {
      const headers = {
        'x-api-version': '1',
      };

      let response = await fetch('http://localhost:8080/continents/Test%20abc%201241', { headers })
      response = await response.json()
      setMessage(response)
    }

    fetchMyAPI()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {message.message}
        </p>
      </header>
    </div>
  );
}

export default App;
