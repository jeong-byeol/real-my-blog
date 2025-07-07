import React, { useState } from "react";
import { ethers } from "ethers";
import FNFT_ABI from "../abi/FNFT.json";
import "./NFTpage.css";
import NavBar from "./NavBar";


const CONTRACT_ADDRESS = "0xd2b7e98f7C93F3917093ac9C88E66A41DFDa5579";
const RPC_URL = "https://public-en-kairos.node.kaia.io";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY!, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, FNFT_ABI, signer);


  //민팅


const NFTpage = () => {
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
  const fetchMeta = async (tokenId: string) => {
    try {
      const tokenURI = await contract.tokenURI(tokenId);
      // IPFS, http 등 처리
      let url = tokenURI;
      if (tokenURI.startsWith("ipfs://")) {
        url = `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`;
      }
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  // 사용자가 보유한 NFT 조회
  const handleUserNFTs = async () => {
    setUserNFTs([]);
    setNftError(null);
    setLoadingNFTs(true);
    try {
      const balance = await contract.balanceOf(userAddress);
      const nfts = [];
      // tokenOfOwnerByIndex가 없으므로, 1~10000까지 ownerOf로 brute-force (실제 사용시 백엔드/이벤트 활용 권장)
      // 여기서는 데모용으로 0~199까지만 조회
      for (let i = 0; i < 200; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const meta = await fetchMeta(i.toString());
            nfts.push({ tokenId: i, meta });
          }
        } catch {}
      }
      setUserNFTs(nfts);
      if (nfts.length === 0) setNftError("보유한 NFT가 없습니다 (또는 범위 내에 없음)");
    } catch (e: any) {
      setNftError("NFT 조회 실패: 주소를 확인하세요");
    }
    setLoadingNFTs(false);
  };

  // 단일 NFT 메타데이터 직접 조회
  const handleMetaLookup = async () => {
    setMeta(null);
    setMetaError(null);
    try {
      const m = await fetchMeta(tokenId);
      if (!m) throw new Error();
      setMeta(m);
    } catch {
      setMetaError("메타데이터를 불러올 수 없습니다");
    }
  };

  return (
    <div className="nftpage-container">
      <NavBar />
      <h2>NFT 기능</h2>
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
        <button onClick={handleMetaLookup}>메타데이터 조회</button>
        {meta && (
          <div className="nft-meta">
            <p>이름: {meta.name}</p>
            <p>설명: {meta.description}</p>
            {meta.image && <img src={meta.image.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${meta.image.replace('ipfs://','')}` : meta.image} alt="nft" style={{maxWidth:200}} />}
            <pre style={{fontSize:12, background:'#eee', padding:8}}>{JSON.stringify(meta, null, 2)}</pre>
          </div>
        )}
        {metaError && <p style={{color:'red'}}>{metaError}</p>}
      </div>
      <div className="nft-section">
        <h3>사용자 주소로 보유 NFT 조회</h3>
        <input
          value={userAddress}
          onChange={e => setUserAddress(e.target.value)}
          placeholder="지갑 주소 입력"
        />
        <button onClick={handleUserNFTs} disabled={loadingNFTs}>{loadingNFTs ? "조회 중..." : "NFT 조회"}</button>
        {nftError && <p style={{color:'red'}}>{nftError}</p>}
        <div className="nft-list">
          {userNFTs.map(nft => (
            <div key={nft.tokenId} className="nft-card">
              <p>Token ID: {nft.tokenId}</p>
              {nft.meta && nft.meta.image && (
                <img src={nft.meta.image.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${nft.meta.image.replace('ipfs://','')}` : nft.meta.image} alt="nft" style={{maxWidth:150}} />
              )}
              {nft.meta && <p>{nft.meta.name}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NFTpage;

