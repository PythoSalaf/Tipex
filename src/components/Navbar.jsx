import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaRobot } from "react-icons/fa6";
import { PiWalletFill } from "react-icons/pi";
import { MdMenu, MdClose } from "react-icons/md";

import { createWallet } from "../lib/createWallet";
import { loadWallet } from "../lib/loadWallet";
import { restoreWallet } from "../lib/restoreWallet";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [address, setAddress] = useState("");

  // ✅ load wallet on start
  useEffect(() => {
    async function init() {
      const wallet = await loadWallet();

      if (wallet) {
        setAddress(wallet.address);
      }
    }

    init();
  }, []);

  // ✅ create wallet
  const handleCreate = async () => {
    if (address) {
      alert("Wallet already connected");
      return;
    }

    const res = await createWallet();

    setAddress(res.address);

    alert("Save this seed:\n" + res.seed);
  };

  // ✅ restore wallet
  const handleRestore = async () => {
    const addr = await restoreWallet(seed);

    setAddress(addr);
  };

  return (
    <div className="w-full fixed bg-black z-50 py-2.5">
      <div className="bg-black text-white flex items-center justify-between w-[95%] mx-auto">
        <div className="flex items-center gap-2">
          <FaRobot className="w-7 h-7 animate-bounce text-[#1ee3bf]" />

          <Link to="/" className="text-2xl font-bold text-gradient">
            Tipex
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/create-agent">Create Agent</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/logs">Logs</NavLink>
        </div>

        <div>
          {address ? (
            <div className="bg-[#1ee3bf] text-black px-2 py-1 rounded-xl">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          ) : (
            <button
              className="bg-[#1ee3bf] text-black px-2 py-1 rounded-xl hidden md:flex items-center gap-1.5 cursor-pointer"
              onClick={handleCreate}
            >
              <PiWalletFill className="h-5 w-5" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
