import { Routes, Route } from "react-router-dom";
import { GiftCategory, GiftSuccessful, Home, TransactionReview } from "./pages";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:category" element={<GiftCategory />} />
        <Route path="/review-transaction" element={<TransactionReview />} />
        <Route path="/successful" element={<GiftSuccessful />} />
      </Routes>
    </>
  );
}

export default App;
