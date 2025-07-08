import React, { useState } from "react";
import { ethers } from "ethers";
import FNFT_ABI from "../abi/FNFT.json";
import "./NFTpage.css";
import NavBar from "./NavBar";


const CONTRACT_ADDRESS = "0xA39fE2cf6dE605fB81FB45B60163367DD67F0F79";
const RPC_URL = "https://public-en-kairos.node.kaia.io";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY!, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, FNFT_ABI, signer);

  

const NFTpage = () => {
  //몇 번 이미지를 보낼지
  const [number, setNumber] = useState("");
  //민팅할 주소
  const [address, setaddress] = useState("");
  // 토큰ID 소유자 조회
  const [tokenId, setTokenId] = useState("");
  const [owner, setOwner] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // 주소로 NFT 조회
  const [userAddress, setUserAddress] = useState("");
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

  // 특정 주소의 NFT tokenIds
  const [addressTokenIds, setAddressTokenIds] = useState<number[]>([]);
  const [addressNFTs, setAddressNFTs] = useState<any[]>([]);
  const [addressNFTLoading, setAddressNFTLoading] = useState(false);
  const [addressNFTError, setAddressNFTError] = useState<string | null>(null);

  // 전체 발행 NFT tokenIds
  const [allTokenIds, setAllTokenIds] = useState<number[]>([]);
  const [allNFTs, setAllNFTs] = useState<any[]>([]);
  const [allNFTLoading, setAllNFTLoading] = useState(false);
  const [allNFTError, setAllNFTError] = useState<string | null>(null);

  // 트랜잭션 해시 상태
  const [txHash, setTxHash] = useState<string | null>(null);

  // 민팅 상태 메시지
  const [mintStatus, setMintStatus] = useState<string | null>(null);

  //민팅
  const mint = async () => {
    setMintStatus("민팅 중...");
    try {
      const tokenURI = `https://storage.googleapis.com/jeonghanbyeol/metsdata/${number}.json`;
      const tx = await contract.mint(address, tokenURI);
      setTxHash(tx.hash);
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

  // 토큰ID 소유자 조회 핸들러
  const handleOwnerLookup = async () => {
    setOwner(null);
    setOwnerError(null);
    try {
      const result = await contract.ownerOf(tokenId);
      setOwner(result);
    } catch (e: any) {
      setOwnerError("존재하지 않는 토큰이거나 조회 실패");
    }
  };

  // NFT 메타데이터 조회
const handleMetaLookup = async () => {
  const uri = await contract.tokenURI(metaTokenId);
  const response = await fetch(uri);
  const metadata = await response.json();

  return metadata;
}


  // NFT 전송 함수
  const handleTransfer = async () => {
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

  // 특정 주소의 NFT tokenId 및 메타데이터 조회 (balanceOf + tokenOfOwnerByIndex)
  const handleAddressNFTs = async () => {
    setAddressNFTs([]);
    setAddressTokenIds([]);
    setAddressNFTError(null);
    setAddressNFTLoading(true);
    try {
      const balance = await contract.balanceOf(userAddress);
      const tokenIds = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
        tokenIds.push(tokenId.toString());
      }
      setAddressTokenIds(tokenIds);
      const nfts = await Promise.all(tokenIds.map(async (id) => {
        const meta = await fetchMeta(id);
        return { tokenId: id, meta };
      }));
      setAddressNFTs(nfts);
      if (nfts.length === 0) setAddressNFTError("보유한 NFT가 없습니다.");
    } catch (e: any) {
      setAddressNFTError("NFT 조회 실패: 주소를 확인하세요");
    }
    setAddressNFTLoading(false);
  };

  // 전체 발행 NFT tokenId 및 메타데이터 조회 (totalSupply + tokenByIndex)
  const handleAllNFTs = async () => {
    setAllNFTs([]);
    setAllTokenIds([]);
    setAllNFTError(null);
    setAllNFTLoading(true);
    try {
      const total = await contract.totalSupply();
      const tokenIds = [];
      for (let i = 0; i < total; i++) {
        const tokenId = await contract.tokenByIndex(i);
        tokenIds.push(tokenId.toString());
      }
      setAllTokenIds(tokenIds);
      const nfts = await Promise.all(tokenIds.map(async (id) => {
        const meta = await fetchMeta(id);
        return { tokenId: id, meta };
      }));
      setAllNFTs(nfts);
      if (nfts.length === 0) setAllNFTError("발행된 NFT가 없습니다.");
    } catch (e: any) {
      setAllNFTError("전체 NFT 조회 실패");
    }
    setAllNFTLoading(false);
  };

  return (
    <div className="nftpage-container">
      <NavBar />
      <h2>NFT 기능</h2>
      <div className="nft-section">
        <h3>민팅</h3>
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
        <h3>특정 토큰ID 소유자 조회</h3>
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
        <h3>특정 NFT 메타데이터/이미지 조회</h3>
        <input
          value={metaTokenId}
          onChange={e => setMetaTokenId(e.target.value)}
          placeholder="토큰ID 입력"
        />
        <button onClick={handleMetaLookup}>메타데이터 조회</button>       

      </div>
      <div className="nft-section">
        <h3>특정 주소의 NFT 목록 조회</h3>
        <input
          value={userAddress}
          onChange={e => setUserAddress(e.target.value)}
          placeholder="지갑 주소 입력"
        />
        <button onClick={handleAddressNFTs} disabled={addressNFTLoading}>{addressNFTLoading ? "조회 중..." : "NFT 조회"}</button>
        {addressNFTError && <p style={{color:'red'}}>{addressNFTError}</p>}
        <div className="nft-list">
          {addressNFTs.map(nft => (
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
        <h3>전체 발행 NFT 목록 조회</h3>
        <button onClick={handleAllNFTs} disabled={allNFTLoading}>{allNFTLoading ? "조회 중..." : "전체 NFT 조회"}</button>
        {allNFTError && <p style={{color:'red'}}>{allNFTError}</p>}
        <div className="nft-list">
          {allNFTs.map(nft => (
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
        <h3>NFT 전송 (transfer)</h3>
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
      </div>     
    </div>
  );
};

export default NFTpage;

