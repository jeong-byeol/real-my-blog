import React, { useState } from "react";
import Web3 from "web3";
import "./Wallet.css";

const web3 = new Web3((window as any).ethereum); // MetaMask provider

const Wallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const connectMetaMask = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        setTxHash(null);
        setBalance(null);
      } catch (err) {
        console.error("MetaMask 연결 실패:", err);
      }
    } else {
      alert("MetaMask가 설치되어 있지 않습니다.");
    }
  };

  const getBalance = async () => {
    if (!walletAddress) return;
    try {
      const balanceWei = await web3.eth.getBalance(walletAddress);
      const ethBalance = web3.utils.fromWei(balanceWei, "ether");
      setBalance(ethBalance);
    } catch (err) {
      console.error("잔액 조회 실패:", err);
    }
  };

  const sendViaMetaMask = async () => {
    if (!walletAddress || !recipient || !amount) {
      alert("주소, 수신자, 금액을 모두 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(`다음 정보를 확인하세요:\n\n받는 사람: ${recipient}\n금액: ${amount} ETH\n\n정말 송금하시겠습니까?`);
    if (!confirmed) return;

    try {
      const txParams = {
        from: walletAddress,
        to: recipient,
        value: web3.utils.toHex(web3.utils.toWei(amount, "ether")),
        gas: web3.utils.toHex(21000),
      };

      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setTxHash(txHash);
    } catch (err) {
      console.error("송금 실패:", err);
      alert("송금 실패: " + (err as Error).message);
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>MetaMask 지갑</h1>

        {!walletAddress ? (
          <button onClick={connectMetaMask} className="action-button">MetaMask 연결</button>
        ) : (
          <div style={{ wordBreak: 'break-all', textAlign: 'left' }}>
            <p><strong>주소:</strong> {walletAddress}</p>
            <button onClick={getBalance} className="action-button">잔액 조회</button>
          </div>
        )}
      </div>

      {balance && (
        <div className="wallet-balance">
          <div className="balance-info">
            <h2>현재 잔액</h2>
            <div className="balance-amount">{balance} ETH</div>
          </div>
        </div>
      )}

      {walletAddress && (
        <div className="wallet-actions">
          <input
            type="text"
            placeholder="받는 사람 주소"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            type="text"
            placeholder="금액 (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "120px" }}
          />
          <button onClick={sendViaMetaMask} className="action-button">송금하기</button>
        </div>
      )}

      {txHash && (
        <div style={{ marginTop: '2rem', wordBreak: 'break-all' }}>
          <h3>트랜잭션 해시</h3>
          <p>{txHash}</p>
        </div>
      )}
    </div>
  );
};

export default Wallet;
