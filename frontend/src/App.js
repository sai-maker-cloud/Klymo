import {Route,Routes} from "react-router";
import LandingPage from "./components/LandingPage/LandingPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<LandingPage />}/>
      </Routes>
    </div>
  );
}

export default App;