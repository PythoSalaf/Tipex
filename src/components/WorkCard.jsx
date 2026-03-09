import { FaRobot } from "react-icons/fa6";

const WorkCard = ({ title, icon, description }) => {
  return (
    <div className="w-[95%] h-56 md:w-full mx-auto bg-[#12151a] rounded-2xl border border-[#141a1e] ">
      <div className="w-[90%] mx-auto py-3">
        <div className="bg-[#13413e] rounded-xl flex items-center justify-center w-8 md:w-10 h-8 md:h-10">
          {icon}
        </div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mt-5 mb-3">
          {title}
        </h3>
        <p className="text-[#687e8e] ">{description}</p>
      </div>
    </div>
  );
};

export default WorkCard;
