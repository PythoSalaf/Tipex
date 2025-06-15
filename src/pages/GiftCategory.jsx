import { useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { MdClose } from "react-icons/md";

const GiftCategory = () => {
  const navigate = useNavigate();
  return (
    <div className="relative w-full text-white py-2">
      <div className="relative w-[94%] mx-auto flex items-center justify-center">
        <div
          className="absolute left-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <MdClose className="size-5.5" />
        </div>
        <h3 className="text-lg font-semibold ">Send a gift</h3>
      </div>
      <div className="w-[94%] mx-auto mt-7">
        <div className="w-full py-2 bg-gray-900 shadow rounded-xl">
          <div className="w-[92%] mx-auto">
            <h2 className="text-gray-500 capitalize text-sm font-semibold">
              wallet balance
            </h2>
            <h4 className="py-2 text-2xl font-semibold">$5,000</h4>
          </div>
        </div>
        <div className="mt-7">
          <div className="bg-gray-900 w-full rounded-xl py-2">
            <div className="w-[92%] mx-auto">
              <h3 className="text-gray-500 font-semibold text-sm">
                Gift family & friends
              </h3>
              <form className="py-4 w-full">
                <div className="w-full flex items-center justify-between gap-x-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full px-2 outline-0 text-sm border border-gray-600 h-10 rounded-lg"
                    placeholder="Enter amount"
                  />
                  <select className="w-full border text-gray-500 pl-2 bg-gray-900 text-xs font-bold uppercase border-gray-600 rounded-lg h-10">
                    <option value="">Avx</option>
                    <option value="">Btc</option>
                    <option value="">Usdt</option>
                    <option value="">Eth</option>
                    <option value="">Sol</option>
                  </select>
                </div>
                <input
                  type="text"
                  className="w-full px-2 outline-0 text-sm border border-gray-600 h-10 rounded-lg mt-4"
                  placeholder="Friend Name"
                />
                <input
                  type="text"
                  className="w-full px-2 outline-0 text-sm border border-gray-600 h-10 rounded-lg mt-4"
                  placeholder="Paste wallet address"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="my-8 w-[94%] mx-auto">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Add a note</h4>
          <CiEdit className="size-5.5" />
        </div>
        <div className="w-full mt-2">
          <textarea
            placeholder="Generate birthday message here"
            className="w-full rounded-xl h-36 resize-none bg-gray-900 outline-0 py-2 px-4"
          />
          <div className="flex items-center justify-center mt-4 w-full">
            <button className="bg-blue-900 px-8 cursor-pointer text-base py-1 rounded-lg">
              Generate wish
            </button>
          </div>
        </div>
      </div>
      <div className="w-[94%] mx-auto mt-14 pb-2">
        <button
          onClick={() => navigate("/review-transaction")}
          className="bg-gray-900 cursor-pointer w-full rounded-2xl py-1.5 capitalize text-sm font-semibold"
        >
          Send gift
        </button>
      </div>
    </div>
  );
};

export default GiftCategory;
