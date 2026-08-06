import "./App.css";
import PeerProvider from "./Provider/PeerProvider";
import Socketprovider from "./Provider/SocketProvider";
import RoutesProvider from "./routes/RoutesProvider";

function App() {
  return (
    <Socketprovider>
      <PeerProvider>
        <RoutesProvider />;
      </PeerProvider>
    </Socketprovider>
  );
}

export default App;
