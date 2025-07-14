import React, { useState, useEffect, useRef } from "react";
import { Web3 } from "web3";
import MultiABI from "../abi/Multi.json";
import NavBar from "./NavBar";

// MetaMask 타입 선언
declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0xc395144FCCFF5A39cd9754BF2B6C425b91C1950D";

type TxData = {
  txHash: string;
  from: string;
  to: string;
  tokenId: string;
  amount?: string;
  eventType: string;
  timestamp: string;
};

const ERC1155page = () => {
  const [tokenId, setTokenId] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [mintId, setMintId] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferId, setTransferId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [uri, setUri] = useState("");
  const [approved, setApproved] = useState(false);
  const [status, setStatus] = useState("");
  const [batchAddresses, setBatchAddresses] = useState("");
  const [batchTokenIds, setBatchTokenIds] = useState("");
  const [batchBalances, setBatchBalances] = useState<string[]>([]);

  // Web3 관련 상태
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // 블록체인 이벤트 관련 상태
  const [txList, setTxList] = useState<TxData[]>([]);
  const [eventSubscription, setEventSubscription] = useState<any>(null);

  // Web3 초기화 및 연결된 지갑 확인
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // 컨트랙트 인스턴스 생성
        const contractInstance = new web3Instance.eth.Contract(MultiABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
        
        // localStorage에서 연결된 지갑 정보 확인
        const savedAddress = localStorage.getItem('metamask_address');
        const savedConnection = localStorage.getItem('metamask_connected');
        
        if (savedAddress && savedConnection === 'true') {
          setUserAddress(savedAddress);
          setAccounts([savedAddress]);
          setIsConnected(true);
        }
      } else {
        console.error("MetaMask가 설치되어 있지 않습니다.");
      }
    };

    initWeb3();
  }, []);

  // 블록체인 이벤트 구독
  useEffect(() => {
    if (!contract) return;

    const subscribeToEvents = () => {
      try {
        // TransferSingle 이벤트 구독
        const transferSingleSubscription = contract.events.TransferSingle({})
          .on('data', (event: any) => {
            console.log('TransferSingle event received:', event);
            
            const txData: TxData = {
              txHash: event.transactionHash,
              from: event.returnValues.from,
              to: event.returnValues.to,
              tokenId: event.returnValues.id,
              amount: event.returnValues.value,
              eventType: 'TransferSingle',
              timestamp: new Date().toISOString()
            };
            
            setTxList(prev => [txData, ...prev.slice(0, 9)]); // 최대 10개만 유지
          })
          .on('error', (error: any) => {
            console.error('TransferSingle event error:', error);
          });

        // TransferBatch 이벤트 구독
        const transferBatchSubscription = contract.events.TransferBatch({})
          .on('data', (event: any) => {
            console.log('TransferBatch event received:', event);
            
            const txData: TxData = {
              txHash: event.transactionHash,
              from: event.returnValues.from,
              to: event.returnValues.to,
              tokenId: event.returnValues.ids.join(', '), // 여러 토큰ID를 문자열로 결합
              amount: event.returnValues.values.join(', '), // 여러 수량을 문자열로 결합
              eventType: 'TransferBatch',
              timestamp: new Date().toISOString()
            };
            
            setTxList(prev => [txData, ...prev.slice(0, 9)]); // 최대 10개만 유지
          })
          .on('error', (error: any) => {
            console.error('TransferBatch event error:', error);
          });

        setEventSubscription({ transferSingle: transferSingleSubscription, transferBatch: transferBatchSubscription });
        console.log('Blockchain event subscription started');
      } catch (error) {
        console.error('Failed to subscribe to blockchain events:', error);
      }
    };

    subscribeToEvents();

    // Cleanup function
    return () => {
      if (eventSubscription) {
        if (eventSubscription.transferSingle) {
          eventSubscription.transferSingle.removeAllListeners();
        }
        if (eventSubscription.transferBatch) {
          eventSubscription.transferBatch.removeAllListeners();
        }
      }
    };
  }, [contract]);



  const handleBalanceOfBatch = async () => {
    if (!contract) return;
    
    try {
      const addresses = batchAddresses.split(",").map(a => a.trim()).filter(Boolean);
      const ids = batchTokenIds.split(",").map(i => i.trim()).filter(Boolean);
      
      if (addresses.length !== ids.length) {
        setStatus("주소와 토큰ID 개수가 다릅니다");
        return;
      }
      
      const balances = await contract.methods.balanceOfBatch(addresses, ids).call();
      setBatchBalances(balances.map((b: any) => b.toString()));
      setStatus("");
    } catch (e: any) {
      setStatus("조회 실패: " + e.message);
      setBatchBalances([]);
    }
  };

  const handleMint = async () => {
    if (!contract || !accounts[0]) {
      setStatus("지갑을 연결해주세요");
      return;
    }
    
    try {
      setStatus("민팅 중...");
      const result = await contract.methods.batchMint(mintTo, [mintId], [mintAmount]).send({
        from: accounts[0],
        gas: 3000000
      });
      setStatus("민팅 성공: " + result.transactionHash);
    } catch (e: any) {
      setStatus("민팅 실패: " + e.message);
    }
  };

  const handleTransfer = async () => {
    if (!contract || !accounts[0]) {
      setStatus("지갑을 연결해주세요");
      return;
    }
    
    try {
      setStatus("전송 중...");
      const result = await contract.methods.safeTransferFrom(
        accounts[0], 
        transferTo, 
        transferId, 
        transferAmount, 
        "0x"
      ).send({
        from: accounts[0],
        gas: 3000000
      });
      setStatus("전송 성공: " + result.transactionHash);
    } catch (e: any) {
      setStatus("전송 실패: " + e.message);
    }
  };

  const handleUri = async () => {
    if (!contract) return;
    
    try {
      const u = await contract.methods.uri(tokenId).call();
      setUri(u);
      setStatus("");
    } catch (e: any) {
      setStatus("URI 조회 실패: " + e.message);
    }
  };

  const handleApprove = async () => {
    if (!contract || !accounts[0]) {
      setStatus("지갑을 연결해주세요");
      return;
    }
    
    try {
      const result = await contract.methods.setApprovalForAll(transferTo, true).send({
        from: accounts[0],
        gas: 100000
      });
      setApproved(true);
      setStatus("승인 성공: " + result.transactionHash);
    } catch (e: any) {
      setStatus("승인 실패: " + e.message);
    }
  };

  return (
    <div className="erc1155-container">
      <NavBar />
      <h2>ERC1155 (Multi) 컨트랙트 데모</h2>

      {/* 지갑 연결 상태 표시 */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>지갑 연결 상태</h3>
        {!isConnected ? (
          <div>
            <p>지갑이 연결되지 않았습니다.</p>
            <button onClick={() => window.location.href = '/metamask'}>
              MetaMask 연결 페이지로 이동
            </button>
          </div>
        ) : (
          <div>
            <p>연결된 주소: {userAddress}</p>
          </div>
        )}
      </div>

      <h3>잔액 조회 (balanceOfBatch)</h3>
      <input value={batchAddresses} onChange={e => setBatchAddresses(e.target.value)} placeholder="주소1,주소2,..." style={{ width: 300 }} />
      <input value={batchTokenIds} onChange={e => setBatchTokenIds(e.target.value)} placeholder="토큰ID1,토큰ID2,..." style={{ width: 200, marginLeft: 8 }} />
      <button onClick={handleBalanceOfBatch}>잔액 일괄 조회</button>
      {batchBalances.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <b>결과:</b>
          <ul>
            {batchBalances.map((bal, i) => (
              <li key={i}>{`주소: ${batchAddresses.split(",")[i]?.trim() || "-"}, 토큰ID: ${batchTokenIds.split(",")[i]?.trim() || "-"} → 잔액: ${bal}`}</li>
            ))}
          </ul>
        </div>
      )}

      <hr />
      <h3>민팅 (batchMint)</h3>
      <input value={mintTo} onChange={e => setMintTo(e.target.value)} placeholder="받는 주소" />
      <input value={mintId} onChange={e => setMintId(e.target.value)} placeholder="Token ID" />
      <input value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="수량" />
      <button onClick={handleMint} disabled={!isConnected}>민팅</button>

      <hr />
      <h3>전송 (safeTransferFrom)</h3>
      <input value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="받는 주소" />
      <input value={transferId} onChange={e => setTransferId(e.target.value)} placeholder="Token ID" />
      <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="수량" />
      <button onClick={handleTransfer} disabled={!isConnected}>전송</button>

      <hr />
      <h3>URI 조회</h3>
      <input value={tokenId} onChange={e => setTokenId(e.target.value)} placeholder="Token ID" />
      <button onClick={handleUri}>URI 조회</button>
      {uri && <div>URI: {uri}</div>}

      <hr />
      <h3>승인 (setApprovalForAll)</h3>
      <input value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="승인할 주소" />
      <button onClick={handleApprove} disabled={!isConnected}>승인</button>
      {approved && <span>승인됨</span>}

      <hr />
      {status && <div style={{ color: "blue" }}>{status}</div>}

      {/* 실시간 트랜잭션 해시 표시 영역 */}
      <hr />
      <h3>실시간 블록체인 이벤트</h3>
      <p style={{ color: '#666', fontStyle: 'italic' }}>
        블록체인에서 발생하는 TransferSingle 및 TransferBatch 이벤트를 실시간으로 모니터링합니다.
      </p>
      {txList.length === 0 ? (
        <p style={{ color: '#999' }}>아직 이벤트가 발생하지 않았습니다. 트랜잭션을 실행해보세요.</p>
      ) : (
        txList.map((tx, idx) => (
          <div key={tx.txHash + idx} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
            <p><b>Event Type:</b> {tx.eventType}</p>
            <p><b>txHash:</b> {tx.txHash}</p>
            <p><b>From:</b> {tx.from}</p>
            <p><b>To:</b> {tx.to}</p>
            <p><b>TokenID:</b> {tx.tokenId}</p>
            {tx.amount && <p><b>Amount:</b> {tx.amount}</p>}
            <p><b>Time:</b> {new Date(tx.timestamp).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default ERC1155page;
