import NavBar from "./NavBar";
import React from "react";
import { ethers } from "ethers";
import abi from "../abi/proxy.json";

const proxyAddress = "0x860806488d547B4927c19bb5487274Effd33185d";
const ContractV2 = "0xa71d48EA73097d2E72c113639F2713799687cF45";

const provider = new ethers.JsonRpcProvider("https://public-en-kairos.node.kaia.io");
const signer = new ethers.Wallet(
  process.env.REACT_APP_PRIVATE_KEY || "",
  provider
);
const proxyContract = new ethers.Contract(proxyAddress, abi, signer);

const ProxyPage: React.FC = () => {
  const upgradProxy = async () => {
    try {
      await proxyContract.upgradeToAndCall(ContractV2, "0x");
      console.log("Proxy contract upgraded successfully");
      console.log(await proxyContract.getImplementation());
    } catch (error) {
      console.error("Error upgrading proxy contract:", error);
    }
  };

  return (
    <div>
      <NavBar />
      <h1>버전 변경(구현체 변경)</h1>
      <button
        onClick={upgradProxy}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Proxy Contract Upgrade
      </button>
    </div>
  );
};

export default ProxyPage;
