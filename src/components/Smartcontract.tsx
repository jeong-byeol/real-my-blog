import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import NavBar from "./NavBar";
import "./Smartcontract.css";

const apiKey = process.env.REACT_APP_POLYGONSCAN_API_KEY;

// 네트워크 정의
const NETWORKS = {
  cardona: {
    name: "Cardona (Chain ID: 2442)",
    rpcUrl: "https://rpc.cardona.zkevm-rpc.com",
    chainId: "2442",
  },
  ethereum: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    chainId: "1",
  },
  polygon: {
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    chainId: "137",
  },
};

const SmartcontractApp: React.FC = () => {
  const [address, setAddress] = useState("");
  const [networkKey, setNetworkKey] = useState<keyof typeof NETWORKS>("cardona");
  const [abi, setAbi] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookupContract = async () => {
    setAbi(null);
    setError(null);

    try {
      if (!ethers.utils.isAddress(address)) {
        setError("유효하지 않은 주소입니다.");
        return;
      }

      const network = NETWORKS[networkKey];
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);

      const code = await provider.getCode(address);
      if (code === "0x") {
        setError("이 주소에는 배포된 스마트 컨트랙트가 없습니다.");
        return;
      }

      const response = await axios.get("https://api.etherscan.io/v2/api", {
        params: {
          module: "contract",
          action: "getsourcecode",
          address,
          chainid: network.chainId,
          apikey: apiKey,
        },
      });

      const data = response.data;

      if (data.status !== "1" || !data.result[0]?.ABI) {
        setError("ABI를 가져올 수 없습니다. (검증되지 않았거나 잘못된 주소)");
        return;
      }

      setAbi(data.result[0].ABI);
    } catch (err: any) {
      console.error(err);
      setError("조회 중 오류 발생: " + err.message);
    }
  };

  return (
    <div className="smart-contract-container">
      <NavBar />
      <h1 className="smart-contract-title">스마트 컨트랙트 조회</h1>

      <div className="contract-form">
        <input
          className="contract-input"
          type="text"
          placeholder="컨트랙트 주소 (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <select
          className="network-select"
          value={networkKey}
          onChange={(e) => setNetworkKey(e.target.value as keyof typeof NETWORKS)}
        >
          {Object.entries(NETWORKS).map(([key, net]) => (
            <option key={key} value={key}>
              {net.name}
            </option>
          ))}
        </select>

        <button className="lookup-button" onClick={lookupContract}>
          조회
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      {abi && (
        <div className="abi-container">
          <h2 className="abi-title">ABI (일부):</h2>
          <pre className="abi-content">{abi}</pre>
        </div>
      )}
    </div>
  );
};

export default SmartcontractApp;
