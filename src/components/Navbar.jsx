import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaRobot } from "react-icons/fa6";
import { PiWalletFill } from "react-icons/pi";
import { MdMenu, MdClose } from "react-icons/md";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="w-full fixed  bg-black z-50 py-2.5 ">
      <div className="bg-black text-white flex items-center justify-between w-[95%] mx-auto">
        <div className="flex items-center gap-2">
          <FaRobot className="w-7 h-7 animate-bounce text-[#1ee3bf]" />
          <h1 className="text-2xl font-bold text-gradient">Tipex</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <NavLink>Home</NavLink>
          <NavLink>Create Agent</NavLink>
          <NavLink>Dashboard</NavLink>
          <NavLink>Logs</NavLink>
        </div>
        <div className="">
          <button className="bg-[#1ee3bf] text-black px-2 py-1 rounded-xl hidden md:flex items-center gap-1.5 cursor-pointer">
            <PiWalletFill className="h-5 w-5" />
            Connect Wallet
          </button>
          <div
            className="flex items-center justify-center w-7 h-7 md:hidden cursor-pointer bg-[#1ee3bf] p-1 rounded-full text-black "
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <MdClose className="h-6 w-6 font-semibold" />
            ) : (
              <MdMenu className="h-6 w-6 font-semibold " />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Navbar;
