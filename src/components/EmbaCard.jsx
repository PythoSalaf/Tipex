import { FaRobot } from "react-icons/fa6";

const EmbaCard = ({ title, status, schedule, amount, receiver, condition }) => {
  return (
    <div className="w-[350px] shrink-0 bg-[#12151c] rounded-xl">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#13413e] rounded-xl flex items-center justify-center w-8 h-8">
              <FaRobot className="h-4 w-4 text-[#1ee3bf]" />
            </div>

            <div>
              <h3 className="text-base font-semibold">{title}</h3>

              <p className="text-xs">
                {status} · {schedule}
              </p>
            </div>
          </div>

          <h4 className="bg-[#153029] text-[#2d8259] text-sm px-3 py-0.5 rounded-2xl">
            {status}
          </h4>
        </div>

        <p className="text-sm text-[#687e8e] font-mono">
          Pay <span className="text-green-500 font-semibold">{amount}</span> to{" "}
          <span className="text-purple-400 font-semibold">{receiver}</span>{" "}
          {condition}
        </p>
      </div>
    </div>
  );
};

export default EmbaCard;
