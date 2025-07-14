import React, { useState, useEffect } from "react";
import { Web3 } from "web3";
import NavBar from "./NavBar";

// MetaMask 타입 선언
declare global {
  interface Window {
    ethereum?: any;
  }
}

const MetamaskPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // 페이지 로드 시 저장된 연결 상태 확인
  useEffect(() => {
    const savedAddress = localStorage.getItem('metamask_address');
    const savedConnection = localStorage.getItem('metamask_connected');
    
    if (savedAddress && savedConnection === 'true') {
      setUserAddress(savedAddress);
      setIsConnected(true);
      
      // Web3 인스턴스 재생성
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // 잔액 조회
        updateBalance(savedAddress, web3Instance);
      }
    }
  }, []);

  // 잔액 업데이트 함수
  const updateBalance = async (address: string, web3Instance: Web3) => {
    try {
      const bal = await web3Instance.eth.getBalance(address);
      setBalance(web3Instance.utils.fromWei(bal, 'ether'));
    } catch (error) {
      console.error("잔액 조회 실패:", error);
    }
  };

  // 메타마스크 연결
  const connectWallet = async () => {
    if (connecting) return;
    
    setConnecting(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask가 설치되어 있지 않습니다. MetaMask를 설치해주세요.');
        return;
      }

      // MetaMask에 연결
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("계정을 선택하지 않았습니다.");
      }
      
      const address = accounts[0];
      setUserAddress(address);
      
      // Web3 인스턴스 생성
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      
      // 잔액 조회
      await updateBalance(address, web3Instance);

      setIsConnected(true);
      
      // localStorage에 연결 정보 저장
      localStorage.setItem('metamask_address', address);
      localStorage.setItem('metamask_connected', 'true');
      
      console.log("지갑 연결 성공:", address);
      
    } catch (err: any) {
      setIsConnected(false);
      setUserAddress(null);
      setWeb3(null);
      setBalance(null);
      console.error("지갑 연결 오류:", err);
      if (err.code === 4001) {
        alert("지갑 연결이 거부되었습니다.");
      } else if (err.code === -32002) {
        alert("이미 지갑 연결 요청이 진행 중입니다. MetaMask 팝업을 확인해주세요.");
      } else {
        alert("지갑 연결에 실패했습니다: " + (err.message || err));
      }
    } finally {
      setConnecting(false);
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = () => {
    setIsConnected(false);
    setUserAddress(null);
    setWeb3(null);
    setBalance(null);
    
    // localStorage에서 연결 정보 제거
    localStorage.removeItem('metamask_address');
    localStorage.removeItem('metamask_connected');
    
    console.log("지갑 연결 해제됨");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <NavBar />
      <h2>MetaMask 지갑 연결</h2>
      
      {!isConnected ? (
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <h3>NFT 기능을 사용하려면 메타마스크 지갑을 연결하세요</h3>
          <button
            onClick={connectWallet}
            disabled={connecting}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              borderRadius: 8,
              background: connecting ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              cursor: connecting ? "not-allowed" : "pointer",
              marginTop: "1rem"
            }}
          >
            {connecting ? "연결 중..." : "메타마스크 지갑 연결"}
          </button>
        </div>
      ) : (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px', 
          marginTop: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>연결된 지갑 정보</h3>
          <div style={{ marginBottom: 16, fontSize: '1.1rem' }}>
            <p><b>지갑 주소:</b> {userAddress}</p>
            <p><b>잔액:</b> {balance !== null ? `${balance} ETH` : '조회 중...'}</p>
            <button 
              onClick={disconnectWallet}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              연결 해제
            </button>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4>연결된 지갑으로 사용 가능한 기능:</h4>
            <ul>
              <li>NFT 민팅 및 전송</li>
              <li>ERC1155 토큰 관리</li>
              <li>블록체인 이벤트 모니터링</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetamaskPage;
