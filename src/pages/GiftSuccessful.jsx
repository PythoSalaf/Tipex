import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Hapy } from "../assets";

const GiftSuccessful = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowConfetti(false);
    }, 7000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative py-2 text-gray-500 w-full">
      {showConfetti && <Confetti width={width} height={height} />}
      <div className="relative w-[94%] mx-auto flex items-center justify-center">
        <div
          className="absolute left-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <MdClose className="size-5.5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-white">Gift Sent</h3>
      </div>
      <div className="w-full mt-7">
        <div className="text-gray-500">
          <h3 className="text-xl capitalize text-center font-semibold">
            Your friend received
          </h3>
          <h4 className="text-xl text-center font-semibold">$100</h4>
        </div>
        <img src={Hapy} alt="" className="w-full h-[50vh]" />
      </div>
      <div className="w-[92%] mx-auto text-gray-500">
        <div className="flex items-start justify-between">
          <div className="">
            <div className="flex items-center text-white gap-x-2">
              <h4 className="text-base font-semibold">To:</h4>
              <h2 className="text-base font-semibold capitalize text-gray-500">
                blessing
              </h2>
            </div>
            <p className="text-sm">Jun 10, 2025</p>
          </div>
          <h2 className="text-base font-bold">$30</h2>
        </div>
        <div className="mt-5 flex items-start justify-between">
          <div className="">
            <div className="flex items-center text-white gap-x-2">
              <h4 className="text-base font-semibold">From:</h4>
              <h2 className="text-base font-semibold capitalize text-gray-500">
                Taoheed
              </h2>
            </div>
            <p className="text-sm">Jun 10, 2025</p>
          </div>
          <h2 className="text-base font-bold">$30</h2>
        </div>
      </div>
      <div className="w-[80%] mx-auto mt-16 ">
        <button
          onClick={() => navigate("/")}
          className="w-full bg-gray-900 rounded-2xl py-1.5 text-sm text-white font-semibold cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default GiftSuccessful;
