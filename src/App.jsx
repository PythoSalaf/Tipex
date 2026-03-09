import { Routes, Route } from "react-router-dom";
import {
  GiftCategory,
  GiftSuccessful,
  Home,
  Layout,
  TransactionReview,
} from "./pages";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/:category" element={<GiftCategory />} />
          <Route path="/review-transaction" element={<TransactionReview />} />
          <Route path="/successful" element={<GiftSuccessful />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
