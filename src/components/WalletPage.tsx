import React, { useState } from "react"; 
import Web3 from "web3";
import { HDNodeWallet } from "ethers";
import * as bip39 from "bip39";
import { Wallet as EthersWallet } from "ethers";
import "./Wallet.css"; 
import NavBar from "./NavBar";

const web3 = new Web3("https://public-en-kairos.node.kaia.io");

const Wallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null); // 주소 생성
  const [privateKey, setPrivateKey] = useState<string | null>(null); // privatekey 생성
  const [copyMessage, setcopyMessage] =useState<string | null>(null); // privatekey 복사 메세지
  const [mnemonic, setMnemonic] = useState<string | null>(null); // 니모닉 문구 생성
  const [mnemonicInput, setMnemonicInput] = useState(''); // 니모닉 문구 입력창
  const [restoreError, setRestoreError] = useState<string | null>(null); // 복구 실패 시 문구
  const [restoreAddress, setrestoreAddress] = useState<string | null>(null); // 복구 시 주소
  const [restorePrivateKey, setrestorePrivateKey] = useState<string | null>(null); //복구 시 개인키
  const [balance, setBalance] = useState<string | null>(null); //현재 잔액
  const [customAddress, setCustomAddress] = useState(''); // 주소 조회 입력창
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const createWalletFromMnemonic = async () => {
   try { 
    const generatedMnemonic = bip39.generateMnemonic(); // 12단어 니모닉 생성
    console.log("Generated mnemonic:", generatedMnemonic);
    const hdWallet = HDNodeWallet.fromPhrase(generatedMnemonic); // 지갑 생성
    console.log("HD Wallet address:", hdWallet.address);

    setMnemonic(generatedMnemonic);
    setWalletAddress(hdWallet.address);
    setPrivateKey(hdWallet.privateKey);
    setcopyMessage(null);
   } catch (err) {
    console.error("지갑 생성 실패:", err);
   }
  };

  const getCustomAddressBalance = async () => { // 주소 조회 시 현재 잔액 
  if (!customAddress) return;
  try {
    const balanceWei = await web3.eth.getBalance(customAddress);
    const ethBalance = web3.utils.fromWei(balanceWei, "ether");
    setBalance(ethBalance);
  } catch (err) {
    console.error("잔액 조회 실패:", err);
    alert("잔액 조회 실패: " + (err as Error).message);
  }
};


  const restoreWalletFromMnemonic = () => { // 지갑 복구 기능
    try {
      if (!bip39.validateMnemonic(mnemonicInput)) {
        setRestoreError("올바르지 않은 니모닉입니다.");
        return;
      }

    const wallet = HDNodeWallet.fromPhrase(mnemonicInput.trim());
    setrestoreAddress(wallet.address);
    setrestorePrivateKey(wallet.privateKey);
    setcopyMessage(null);
    setRestoreError(null);
    } catch (err) {
    console.error("복원 실패:", err);
    setRestoreError("지갑 복원에 실패했습니다.");
    }
  };

  
  const copyToClipboard = async () => {  //privatekey 복사 기능
    if (!privateKey) return;
    try {
      await navigator.clipboard.writeText(privateKey);
      setcopyMessage("개인키가 복사되었습니다.");
      setTimeout(() => setcopyMessage(null), 2000);
    } catch (err) {
      setcopyMessage("복사 실패");
    }
  };

  const getBalance = async () => { //잔액조회
    if (!walletAddress) return;
    try {
      const balanceWei = await web3.eth.getBalance(walletAddress);
      const ethBalance = web3.utils.fromWei(balanceWei, "ether");
      setBalance(ethBalance);
    } catch (err) {
      console.error("잔액 조회 실패:", err);
    }
  };

  const sendBetweenLocalWallets = async () => { //직접 서명해서 송금 
  if (!walletAddress || !privateKey || !recipient || !amount) {
    alert("정보가 부족합니다.");
    return;
  }

  try {
    const nonce = await web3.eth.getTransactionCount(walletAddress, "latest");
    const tx = {
      to: recipient,
      value: web3.utils.toWei(amount, "ether"),
      gas: 21000,
      nonce,
      chainId: 80002 // Amoy testnet
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    if (!signedTx.rawTransaction) {
      alert("트랜잭션 서명 실패: rawTransaction이 없습니다.");
      return;
    }

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    if (receipt && receipt.transactionHash) {
      setTxHash(receipt.transactionHash.toString());
    } else {
      alert("트랜잭션은 전송되었지만 해시를 찾을 수 없습니다.");
      console.log("receipt", receipt);
    }
    
  } catch (err) {
    console.error("송금 실패:", err);
    alert("송금 실패: " + (err as Error).message);
  }
};


  // const sendViaMetaMask = async () => { //MetaMask 송금하기
  //   if (!walletAddress || !recipient || !amount) {
  //     alert("주소, 수신자, 금액을 모두 입력해주세요.");
  //     return;
  //   }

  //   const confirmed = window.confirm(`다음 정보를 확인하세요:\n\n받는 사람: ${recipient}\n금액: ${amount} ETH\n\n정말 송금하시겠습니까?`);
  //   if (!confirmed) return;

  //   try {
      
  //     const txParams = {
  //       from: walletAddress,
  //       to: recipient,
  //       value: web3.utils.toHex(web3.utils.toWei(amount, "ether")),
  //       gas: web3.utils.toHex(21000),
  //     };

  //     const txHash = await (window as any).ethereum.request({
  //       method: "eth_sendTransaction",
  //       params: [txParams],
  //     });

  //     setTxHash(txHash);
  //   } catch (err) {
  //     console.error("송금 실패:", err);
  //     alert("송금 실패: " + (err as Error).message);
  //   }
  // };

  return (
    <div className="wallet-container">
      <NavBar />
      <div className="wallet-header">
        <h1>지갑 생성기</h1>

        {!walletAddress ? (
          <button onClick={createWalletFromMnemonic} className="action-button">니모닉 지갑생성</button>
        ) : (
          <div>
          <div style={{ wordBreak: 'break-all', textAlign: 'left' }}>
            {mnemonic && (<div><p><strong>니모닉 문구:</strong> {mnemonic}</p></div>)}
            <p><strong>생성된 주소 :</strong> {walletAddress}</p>
            <button onClick={getBalance} className="action-button">잔액 조회</button>
            <button onClick={copyToClipboard} className="action-bytton">개인키 복사</button>
            {copyMessage && <p style={{ color: "green" }}>{copyMessage}</p>}
          </div>
          <div style={{ marginBottom: "1rem" }}>
          <h3>주소 가져오기</h3>
          <textarea
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          placeholder="니모닉문구을 입력하세요."
          rows={1}
          style={{ width: "100%", resize: "none" }}/>
          <button onClick={restoreWalletFromMnemonic} className="action-button" style={{ marginTop: "0.5rem" }}>가져오기</button>
          {restoreError && <p style={{ color: "red" }}>{restoreError}</p>}
          <div style={{ wordBreak: 'break-all', textAlign: 'left' }}>
          <p><strong>복구된 주소 :</strong> {restoreAddress}</p>
          <p><strong>복구된 개인키 :</strong> {restorePrivateKey}</p>
          </div>
        </div>
        </div>
        )}     
      </div>
        <div className="wallet-actions" style={{ marginTop: "2rem" }}>
          <h3>주소 잔액 조회</h3>
          <input
            type="text"
            placeholder="조회할 주소를 입력하세요"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
             style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button onClick={getCustomAddressBalance} className="action-button">잔액 조회</button>
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
          <button onClick={sendBetweenLocalWallets } className="action-button">송금하기</button>
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
