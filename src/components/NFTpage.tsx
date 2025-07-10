import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import FNFT_ABI from "../abi/FNFT.json";
import "./NFTpage.css";
import NavBar from "./NavBar";
import { io, Socket } from "socket.io-client";
import { MetaMaskSDK } from "@metamask/sdk";

const CONTRACT_ADDRESS = "0xA39fE2cf6dE605fB81FB45B60163367DD67F0F79";

type TxData = {
  txHash: string;
  from: string;
  to: string;
  tokenId: string;
};

const NFTpage = () => {
  //메타마스크 연결 시 UI활성화
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  //메타마스크 연동
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
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

  // socket 이벤트 리스닝 트랜잭션 해시 상태
  const [txList, setTxList] = useState<TxData[]>([]);
  const socketRef = useRef<Socket | null>(null);

  //1. 민팅
  const mint = async () => {
    if (!contract) return;
    setMintStatus("민팅 중...");
    try {
      const tokenURI = `https://storage.googleapis.com/jeonghanbyeol/metsdata/${number}.json`;
      const tx = await contract.mint(address, tokenURI);
      const receipt = await tx.wait();
      // Transfer 이벤트에서 토큰ID 추출
      let mintedTokenId = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === "Transfer") {
              mintedTokenId = parsed.args.tokenId?.toString();
              break;
            }
          } catch {}
        }
      }
      setMintStatus(`민팅완료, 해시 : ${tx.hash}, 토큰ID : ${mintedTokenId}`);
      
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
      const result = await contract.ownerOf(tokenId);
      setOwner(result);
    } catch (e: any) {
      setOwnerError("존재하지 않는 토큰이거나 조회 실패");
    }
  };

  // 6. NFT 전송 함수
  const handleTransfer = async () => {
    if (!contract || !signer) return;
    setTransferLoading(true);
    try {
      const from = await signer.getAddress();
      const tx = await contract.transferFrom(from, transferTo, transferTokenId);
      setTxHash(tx.hash);
      await tx.wait();
      alert(`전송 성공!\n트랜잭션 해시: ${tx.hash}`);
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
      const total = await contract.totalSupply();
      const tokenIds: string[] = [];
      for (let i = 0; i < total; i++) {
        const tokenId = await contract.tokenByIndex(i);
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
    const response = await contract.tokenURI(tokenId); //URI 가져옴
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
      const balance = await contract.balanceOf(targetAddress);
      const nfts = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(targetAddress, i);
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

  // 소켓 연결 및 트랜잭션 이벤트 리스너 등록
  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("newTx", (data) => {
      setTxList(prev => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
      socket.off("newTx");
    };
  }, []);

  const [balance, setBalance] = useState<string | null>(null);

//메타마스크 연결
  const connectWallet = async () => {
    try {
      // 1. MetaMaskSDK 인스턴스 생성
      const MMSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "NFT Dapp",
          url: window.location.href,
        },
      });
      // 2. 계정 연결
      const accounts = await MMSDK.connect();
      if (!accounts || accounts.length === 0) throw new Error("No accounts");
      setUserAddress(accounts[0]);
      // 3. provider 생성 (ethers v6)
      const mmProvider = MMSDK.getProvider();
      if (!mmProvider) throw new Error("MetaMask provider not found");
      const provider = new ethers.BrowserProvider(mmProvider);
      // 4. signer 생성
      const signer = await provider.getSigner();
      setSigner(signer);
      // 5. contract 인스턴스 생성 (signer로)
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, FNFT_ABI, signer);
      setContract(contractInstance);
      // 6. 잔액 조회
      const bal = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(bal));

      setIsConnected(true);
    } catch (err) {
      alert("지갑 연결에 실패했습니다");
    }
  };


  if (!isConnected) {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h2>NFT 기능을 사용하려면 메타마스크 지갑을 연결하세요</h2>
      <button
        onClick={connectWallet}
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
        메타마스크 지갑 연결
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
      {!signer ? (
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
          {/* 실시간 트랜잭션 해시 표시 영역 */}
          <h3>실시간 트랜잭션</h3>
          {txList && txList.map((tx, idx) => (
            <div key={tx.txHash + idx}>
              <p><b>txHash:</b> {tx.txHash}</p>
              <p><b>From:</b> {tx.from}</p>
              <p><b>To:</b> {tx.to}</p>
              <p><b>TokenID:</b> {tx.tokenId}</p>
              <hr />
            </div>
          ))}
        </>
      )}
    </div>

 )
}

export default NFTpage;

