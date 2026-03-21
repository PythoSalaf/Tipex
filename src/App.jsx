import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  CreatePaymentAgent,
  Dashboard,
  GiftSuccessful,
  Home,
  Layout,
  LogPage,
} from "./pages";
import { startAgentEngine, stopAgentEngine } from "./lib/agentEngine";

function App() {
  useEffect(() => {
    startAgentEngine();
    return () => stopAgentEngine();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="create-agent" element={<CreatePaymentAgent />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/successful" element={<GiftSuccessful />} />
          <Route path="/logs" element={<LogPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
