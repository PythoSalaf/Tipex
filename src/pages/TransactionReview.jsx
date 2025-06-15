import { MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const TransactionReview = () => {
  const navigate = useNavigate();
  return (
    <div className="relative w-full text-gray-500 py-2">
      <div className="relative w-[94%] mx-auto flex items-center justify-center">
        <div
          className="absolute left-0 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <MdClose className="size-5.5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-white">Send AVX</h3>
      </div>
      <div className="w-[94%] mx-auto mt-6">
        <h4 className="text-center text-base font-semibold">
          Sending $25 to Felix, for birthday gift
        </h4>
        <h3 className="mt-6 text-white font-semibold text-base">
          Transaction Details
        </h3>
        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">To</h4>
          <p className="text-xs font-semibold">
            Dx1B2dFf434d3c9A3aDd6159eBc3C0e4Bd7c31e6F5
          </p>
        </div>
        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">Amount</h4>
          <p className="text-sm font-semibold">100.00 Avx</p>
        </div>
        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">
            Transaction Fee
          </h4>
          <p className="text-sm font-semibold">0.7 Avx</p>
        </div>
        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">Total</h4>
          <p className="text-sm font-semibold">100.70 Avx</p>
        </div>
        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">Note</h4>
          <p className="text-xs font-semibold">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolore a
            voluptate doloremque adipisci, velit unde. Velit quibusdam a, alias
            molestias libero sint eligendi nobis perferendis tempora repellat,
            quo cumque. Expedita ipsum libero sint adipisci debitis
            necessitatibus nihil maxime repellat quo odit! Ipsa vero culpa
            pariatur.
          </p>
        </div>
        <div className="w-[80%] mx-auto mt-20">
          <button
            onClick={() => navigate("/successful")}
            className="w-full bg-gray-900 rounded-2xl text-white py-1.5 text-sm font-semibold cursor-pointer"
          >
            Send AVX
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionReview;
