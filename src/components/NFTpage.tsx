import React, { useState, useEffect, useRef } from "react";
import { Web3 } from "web3";
import FNFT_ABI from "../abi/FNFT.json";
import "./NFTpage.css";
import NavBar from "./NavBar";

// MetaMask 타입 선언
declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0xA39fE2cf6dE605fB81FB45B60163367DD67F0F79";

type TxData = {
  txHash: string;
  from: string;
  to: string;
  tokenId: string;
  eventType: string;
  timestamp: string;
};

const NFTpage = () => {
  //Web3 연동
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  //몇 번 이미지를 보낼지
  const [number, setNumber] = useState("");
  //민팅할 주소
  const [address, setaddress] = useState("");
  // 토큰ID 소유자 조회
  const [tokenId, setTokenId] = useState("");
  const [owner, setOwner] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // 주소로 NFT 조회
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [nftError, setNftError] = useState<string | null>(null);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // 단일 NFT 메타데이터
  const [meta, setMeta] = useState<any | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  // 단일 NFT 메타데이터 조회용 토큰ID
  const [metaTokenId, setMetaTokenId] = useState("");

  // NFT 전송 상태
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // 전체 발행 NFT tokenIds
  const [allTokenIds, setAllTokenIds] = useState<string[]>([]); // number[] → string[]로 변경
  const [allNFTs, setAllNFTs] = useState<any[]>([]);
  const [allNFTLoading, setAllNFTLoading] = useState(false);
  const [allNFTError, setAllNFTError] = useState<string | null>(null);

  // 트랜잭션 해시 상태
  const [txHash, setTxHash] = useState<string | null>(null);

  // 민팅 상태 메시지
  const [mintStatus, setMintStatus] = useState<string | null>(null);

  // 블록체인 이벤트 관련 상태
  const [txList, setTxList] = useState<TxData[]>([]);
  const [eventSubscription, setEventSubscription] = useState<any>(null);

  const [balance, setBalance] = useState<string | null>(null);

  // WebSocket 컨트랙트 참조
  const contractRef = useRef<any>(null);

  // Web3 초기화 및 연결된 지갑 확인
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // 컨트랙트 인스턴스 생성
        const contractInstance = new web3Instance.eth.Contract(FNFT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
        
        // localStorage에서 연결된 지갑 정보 확인
        const savedAddress = localStorage.getItem('metamask_address');
        const savedConnection = localStorage.getItem('metamask_connected');
        
        if (savedAddress && savedConnection === 'true') {
          setUserAddress(savedAddress);
          setAccounts([savedAddress]);
          setIsConnected(true);
          
          // 잔액 조회
          const bal = await web3Instance.eth.getBalance(savedAddress);
          setBalance(web3Instance.utils.fromWei(bal, 'ether'));
        }
      } else {
        console.error("MetaMask가 설치되어 있지 않습니다.");
      }
    };

    initWeb3();
  }, []);

  // WebSocketProvider로 contractRef 생성 (이벤트 리스닝용)
  useEffect(() => {
    const wsProvider = new Web3.providers.WebsocketProvider('wss://base-sepolia.infura.io/ws/v3/b7497c1d6ddf4d94a13ca50026bc2f93');
    if (Web3.utils.isAddress(CONTRACT_ADDRESS.trim())) {
      const web3ws = new Web3(wsProvider);
      contractRef.current = new web3ws.eth.Contract(FNFT_ABI as any, CONTRACT_ADDRESS.trim());
    } else {
      contractRef.current = null;
    }
    return () => {
      wsProvider.disconnect();
    };
  }, []);

  // transfer 이벤트 리스닝 (컨트랙트 주소, 토큰ID, 지갑주소 변경 시마다)
  useEffect(() => {
    if (!contractRef.current) return;
    const contract = contractRef.current;
    
    // 토큰ID 조회용 이벤트
    let tokenIdListener: any;
    if (tokenId) {
      tokenIdListener = contract.events.Transfer({ filter: { tokenId: Number(tokenId) } })
        .on('data', () => {
          handleOwnerLookup(); // 토큰ID 조회 자동 갱신
        });
    }
    
    // 지갑주소 조회용 이벤트
    let walletListener: any;
    if (address) {
      walletListener = contract.events.Transfer({ filter: { to: address } })
        .on('data', () => {
          handleUserNFTs(); // 지갑주소로 들어오는 NFT 실시간 반영
        });
    }
    
    return () => {
      if (tokenIdListener && tokenIdListener.unsubscribe) tokenIdListener.unsubscribe();
      if (walletListener && walletListener.unsubscribe) walletListener.unsubscribe();
    };
  }, [tokenId, address]);

  // 블록체인 이벤트 구독 (기본 이벤트)
  useEffect(() => {
    if (!contract) return;

    const subscribeToEvents = () => {
      try {
        // Transfer 이벤트 구독 (ERC721)
        const transferSubscription = contract.events.Transfer({})
          .on('data', (event: any) => {
            console.log('Transfer event received:', event);
            
            const txData: TxData = {
              txHash: event.transactionHash,
              from: event.returnValues.from,
              to: event.returnValues.to,
              tokenId: event.returnValues.tokenId,
              eventType: 'Transfer',
              timestamp: new Date().toISOString()
            };
            
            setTxList(prev => [txData, ...prev.slice(0, 9)]); // 최대 10개만 유지
          })
          .on('error', (error: any) => {
            console.error('Transfer event error:', error);
          });

        // Approval 이벤트 구독
        const approvalSubscription = contract.events.Approval({})
          .on('data', (event: any) => {
            console.log('Approval event received:', event);
            
            const txData: TxData = {
              txHash: event.transactionHash,
              from: event.returnValues.owner,
              to: event.returnValues.approved,
              tokenId: event.returnValues.tokenId,
              eventType: 'Approval',
              timestamp: new Date().toISOString()
            };
            
            setTxList(prev => [txData, ...prev.slice(0, 9)]); // 최대 10개만 유지
          })
          .on('error', (error: any) => {
            console.error('Approval event error:', error);
          });

        setEventSubscription({ 
          transfer: transferSubscription, 
          approval: approvalSubscription 
        });
        console.log('Blockchain event subscription started');
      } catch (error) {
        console.error('Failed to subscribe to blockchain events:', error);
      }
    };

    subscribeToEvents();

    // Cleanup function
    return () => {
      if (eventSubscription) {
        if (eventSubscription.transfer) {
          eventSubscription.transfer.removeAllListeners();
        }
        if (eventSubscription.approval) {
          eventSubscription.approval.removeAllListeners();
        }
      }
    };
  }, [contract]);

  //1. 민팅
  const mint = async () => {
    if (!contract || !accounts[0]) return;
    setMintStatus("민팅 중...");
    try {
      const tokenURI = `https://storage.googleapis.com/jeonghanbyeol/metsdata/${number}.json`;
      const result = await contract.methods.mint(address, tokenURI).send({
        from: accounts[0],
        gas: 3000000
      });
      
      // Transfer 이벤트에서 토큰ID 추출
      let mintedTokenId = null;
      if (result.events && result.events.Transfer) {
        mintedTokenId = result.events.Transfer.returnValues.tokenId;
      }
      
      setMintStatus(`민팅완료, 해시 : ${result.transactionHash}, 토큰ID : ${mintedTokenId}`);
      
    } catch (e: any) {
      setMintStatus(null);
      alert("민팅 실패: " + (e?.message || e));
    }
  }

  // 2. 토큰ID 소유자 조회 핸들러
  const handleOwnerLookup = async () => {
    if (!contract) return;
    setOwner(null);
    setOwnerError(null);
    try {
      const result = await contract.methods.ownerOf(tokenId).call();
      setOwner(result);
    } catch (e: any) {
      setOwnerError("존재하지 않는 토큰이거나 조회 실패");
    }
  };

  // 6. NFT 전송 함수
  const handleTransfer = async () => {
    if (!contract || !accounts[0]) return;
    setTransferLoading(true);
    try {
      const result = await contract.methods.transferFrom(accounts[0], transferTo, transferTokenId).send({
        from: accounts[0],
        gas: 3000000
      });
      setTxHash(result.transactionHash);
      alert(`전송 성공!\n트랜잭션 해시: ${result.transactionHash}`);
    } catch (e: any) {
      alert("전송 실패: " + (e?.message || e));
    }
    setTransferLoading(false);
  };

  // 5.전체 발행 NFT tokenId 조회 
  const handleAllNFTs = async () => {
    if (!contract) return;
    setAllNFTs([]);
    setAllTokenIds([]);
    setAllNFTError(null);
    setAllNFTLoading(true);
    try {
      const total = await contract.methods.totalSupply().call();
      const tokenIds: string[] = [];
      for (let i = 0; i < total; i++) {
        const tokenId = await contract.methods.tokenByIndex(i).call();
        tokenIds.push(tokenId.toString());
      }
      setAllTokenIds(tokenIds);
      // 메타데이터 조회 없이 tokenId만 allNFTs에 저장
      const nfts = tokenIds.map(id => ({ tokenId: id }));
      setAllNFTs(nfts);
      if (nfts.length === 0) setAllNFTError("발행된 NFT가 없습니다.");
    } catch (e: any) {
      setAllNFTError("전체 NFT 조회 실패: " + (e?.message || e));
    }
    setAllNFTLoading(false);
  };

  // 3. 특정 NFT 메타데이터/이미지 조회
  const handleMetaLookup = async () => {
    if (!contract) return;
    setMeta(null);
    setMetaError(null);
    try {
      const m = await fetchMeta(Number(metaTokenId));
      if (!m) throw new Error();
      setMeta(m);
    } catch {
      setMetaError("메타데이터를 불러올 수 없습니다");
    }
  };

  async function fetchMeta(tokenId: number): Promise<any> {
    if (!contract) return null;
    const response = await contract.methods.tokenURI(tokenId).call(); //URI 가져옴
    const metadataResponse = await fetch(response); // 해당 URI에 HTTP요청
    return await metadataResponse.json(); // JSON 메타데이터 반환
  }

  // 4. 특정 주소의 NFT 목록 조회 함수 (메타데이터 포함)
  const handleUserNFTs = async (addressOverride?: string) => {
    if (!contract) return;
    const targetAddress = addressOverride || userAddress;
    setUserNFTs([]);
    setNftError(null);
    setLoadingNFTs(true);
    try {
      const balance = await contract.methods.balanceOf(targetAddress).call();
      const nfts = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.methods.tokenOfOwnerByIndex(targetAddress, i).call();
        const meta = await fetchMeta(Number(tokenId));
        nfts.push({ tokenId: tokenId.toString(), meta });
      }
      setUserNFTs(nfts);
      if (nfts.length === 0) setNftError("해당 주소가 소유한 NFT가 없습니다.");
    } catch (e: any) {
      setNftError("NFT 조회 실패: " + (e?.message || e));
    }
    setLoadingNFTs(false);
  };



  if (!isConnected) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h2>NFT 기능을 사용하려면 메타마스크 지갑을 연결하세요</h2>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          MetaMask 페이지에서 지갑을 먼저 연결해주세요.
        </p>
        <button
          onClick={() => window.location.href = '/metamask'}
          className="nft-connect-btn"
          style={{
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            borderRadius: 8,
            background: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          MetaMask 연결 페이지로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="nftpage-container">
      <NavBar />
      <h2>연결된 지갑 잔액</h2>
      {userAddress && (
        <div style={{ marginBottom: 16, fontSize: '1.1rem' }}>
          <b>지갑 주소:</b> {userAddress}<br />
          <b>잔액:</b> {balance !== null ? `${balance} ETH` : '조회 중...'}
        </div>
      )}
      {!contract ? (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>NFT 기능을 사용하려면 메타마스크 지갑을 연결하세요</h2>
          <button onClick={() => alert("메타마스크 지갑을 연결해주세요.")} className="nft-connect-btn" style={{ padding: '1rem 2rem', fontSize: '1.2rem', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>지갑 연결</button>
        </div>
      ) : (
        <>
          <h2>NFT 기능</h2>
          <div className="nft-section">
            <h3>1.민팅</h3>
            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="민팅할 이미지 번호"
              />
            <input
              value={address}
              onChange={e => setaddress(e.target.value)}
              placeholder="수신자 주소"
              />
              <button onClick={mint}>민팅</button>
              {mintStatus && <div style={{marginTop:8, color: mintStatus === '민팅완료' ? 'green' : '#2563eb'}}>{mintStatus}</div>}
          </div>
          <div className="nft-section">
            <h3>2.특정 토큰ID 소유자 조회</h3>
            <input
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
              placeholder="토큰ID 입력"
            />
            <button onClick={handleOwnerLookup}>소유자 조회</button>
            {owner && <p>소유자: {owner}</p>}
            {ownerError && <p style={{color:'red'}}>{ownerError}</p>}
          </div>
          <div className="nft-section">
            <h3>3.특정 NFT 메타데이터/이미지 조회</h3>
            <input
              value={metaTokenId}
              onChange={e => setMetaTokenId(e.target.value)}
              placeholder="토큰ID 입력"
            />
            <button onClick={handleMetaLookup}>메타데이터 조회</button>
            {meta && (
              <div className="nft-meta">
                <p>이름: {meta.name}</p>
                <p>설명: {meta.description}</p>
                {meta.image && <img src={meta.image} alt="nft" style={{maxWidth:200}} />}
                <pre style={{fontSize:12, background:'#eee', padding:8}}>{JSON.stringify(meta, null, 2)}</pre>
              </div>
            )}
            {metaError && <p style={{color:'red'}}>{metaError}</p>}
          </div>
          <div className="nft-section">
            <h3>4.특정 주소의 NFT 목록 조회</h3>
            <input
              value={userAddress ?? ''}
              onChange={e => setUserAddress(e.target.value)}
              placeholder="지갑 주소 입력"
            />
            <button onClick={() => handleUserNFTs()} disabled={loadingNFTs}>
              {loadingNFTs ? "조회 중..." : "NFT 조회"}
            </button>
            {nftError && <p style={{color:'red'}}>{nftError}</p>}
            <div className="nft-list">
              {userNFTs.map(nft => (
                <div key={nft.tokenId} className="nft-card">
                  <p>Token ID: {nft.tokenId}</p>
                  {nft.meta && nft.meta.image && (
                    <img src={nft.meta.image} alt="nft" style={{maxWidth:150}} />
                  )}
                  {nft.meta && <p>{nft.meta.name}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="nft-section">
            <h3>5.전체 발행 NFT 목록 조회</h3>
            <button onClick={handleAllNFTs} disabled={allNFTLoading}>{allNFTLoading ? "조회 중..." : "전체 NFT 조회"}</button>
            {allNFTError && <p style={{color:'red'}}>{allNFTError}</p>}
            <div className="nft-list">
              {allTokenIds && <p>전체 토큰 Id 수: {allTokenIds.length}</p>}
              {allNFTs.length === 0 && !allNFTLoading && !allNFTError && (
                <p>아직 발행된 NFT가 없습니다.</p>
              )}
              {allNFTs.map(nft => (
                <div key={nft.tokenId} className="nft-card">
                  <p>Token ID: {nft.tokenId}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="nft-section">
            <h3>6.NFT 전송 (transfer)</h3>
            <input
              value={transferTokenId}
              onChange={e => setTransferTokenId(e.target.value)}
              placeholder="보낼 토큰ID"
            />
            <input
              value={transferTo}
              onChange={e => setTransferTo(e.target.value)}
              placeholder="받는 주소"
            />
            <button onClick={handleTransfer} disabled={transferLoading}>
              {transferLoading ? "전송 중..." : "NFT 전송"}
            </button>
            {txHash && <div>트랜잭션 해시: {txHash}</div>}
          </div>     
          {/* 실시간 블록체인 이벤트 표시 영역 */}
          <h3>실시간 블록체인 이벤트</h3>
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            블록체인에서 발생하는 Transfer 및 Approval 이벤트를 실시간으로 모니터링합니다.
          </p>
          {txList.length === 0 ? (
            <p style={{ color: '#999' }}>아직 이벤트가 발생하지 않았습니다. 트랜잭션을 실행해보세요.</p>
          ) : (
            txList.map((tx: TxData, idx: number) => (
              <div key={tx.txHash + idx} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
                <p><b>Event Type:</b> {tx.eventType}</p>
                <p><b>txHash:</b> {tx.txHash}</p>
                <p><b>From:</b> {tx.from}</p>
                <p><b>To:</b> {tx.to}</p>
                <p><b>TokenID:</b> {tx.tokenId}</p>
                <p><b>Time:</b> {new Date(tx.timestamp).toLocaleString()}</p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default NFTpage;

