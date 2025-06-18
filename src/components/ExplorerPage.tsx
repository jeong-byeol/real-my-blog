import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import NavBar from './NavBar';
import TxHashDetail from './TxhashDetail';
import './ExplorerPage.css';



const web3 = new Web3('https://polygon-rpc.com'); //폴리곤 메인넷 rpc 사용

const POLYGONSCAN_API_KEY = process.env.REACT_APP_POLYGONSCAN_API_KEY; // 폴리곤 api 사용

const BlockchainExplorer = () => {
  const [txHash, setTxHash] = useState('');  // 트랜잭션 해시 입력창
  const [txInfo, setTxInfo] = useState<any | null>(null); // 트랜잭션 해시 입력 시 트랜잭션 정보들
  const [blockNumber, setBlockNumber] = useState(''); // 블록 번호 입력창
  const [blockInfo, setBlockInfo] = useState<any | null>(null); // 블록 번호 입력 시 블록 정보들
  const [address, setAddress] = useState(''); // 계정 입력창
  const [balance, setBalance] = useState<string | null>(null); // 계정 입력 시 잔액 정보
  const [txList, setTxList] = useState<any[]>([]); // api로 얻은 트랜잭션 리스트
  const [latestBlock, setLatestBlock] = useState<{ // 네트워크 상태
    blockTime: number;
    latestBlockNumber: number;
    gasPrice: string;
  } | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null); // "트랜잭션 해시: " 에 버튼으로 만들고 버튼클릭 시 트랜잭션 해시 넣는 곳

  const fetchTransaction = async () => { // 트랜잭션 조회
    try {
      const tx = await web3.eth.getTransaction(txHash); //트랜잭션 세부 정보
      const receipt = await web3.eth.getTransactionReceipt(txHash); 
      setTxInfo({ ...tx, status: receipt.status }); //트랜잭션 상태 1 or 0
    } catch (err) {
      alert('트랜잭션 정보를 불러오지 못했습니다.');
    }
  };

  const fetchBlock = async () => { // 블록 정보 조회
    try {
      const block = await web3.eth.getBlock(Number(blockNumber), true); 
      setBlockInfo(block);
    } catch (err) {
      alert('블록 정보를 불러오지 못했습니다.');
    }
  };

  const fetchBalance = async () => {
    try {
      const balanceWei = await web3.eth.getBalance(address);
      setBalance(web3.utils.fromWei(balanceWei, 'ether'));
    } catch (err) {
      alert('잔액을 조회할 수 없습니다.');
    }
  };

  const fetchNetworkStatus = async () => {
    const latest = await web3.eth.getBlock('latest');
    const prev = await web3.eth.getBlock(Number(latest.number) - 1);
    const blockTime = Number(latest.timestamp) - Number(prev.timestamp);
    const gasPrice = await web3.eth.getGasPrice();
    setLatestBlock({
      blockTime,
      latestBlockNumber: Number(latest.number),
      gasPrice: gasPrice.toString(),
    });
  };

  useEffect(() => {
    fetchNetworkStatus();
  }, []);

   

const fetchTxListWithScanApi = async () => {
  if (!address) return alert('지갑 주소를 입력하세요.');

  try {
    const response = await fetch(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${POLYGONSCAN_API_KEY}`
    );
    const data = await response.json();

    if (data.status !== '1') {
      throw new Error(data.result || '트랜잭션 내역이 없습니다.');
    }

    setTxList(data.result);
  } catch (err: any) {
    console.error(err);
    alert(`에러 발생: ${err.message || JSON.stringify(err)}`);
  }
};


  return (
    <div className="explorer-container">
        <NavBar />
      <div className="explorer-section">
        <h2>트랜잭션 조회</h2>
        <input className="explorer-input" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Tx Hash" />
        <button className="explorer-button" onClick={fetchTransaction}>조회</button>
        {txInfo && (<div className="tx-info">
        <p><strong>트랜잭션 해시:</strong> <span className="tx-hash">{txInfo.hash}</span></p>
        <p><strong>블록 번호:</strong> {txInfo.blockNumber}</p>
        <p><strong>송신자:</strong> <span className="tx-hash">{txInfo.from}</span></p>
        <p><strong>수신자:</strong> <span className="tx-hash">{txInfo.to}</span></p>
        <p><strong>보낸 금액:</strong> <span className="tx-amount">{web3.utils.fromWei(txInfo.value, 'ether')} MATIC</span></p>
        <p><strong>상태:</strong> <span className={txInfo.status === '1' ? 'tx-status-success' : 'tx-status-failure'}>{txInfo.status === '1' ? '성공' : '실패'}</span></p>
        <p><strong>가스 수수료:</strong> <span className="tx-gas">{(Number(txInfo.gasPrice) / 1e9).toFixed(2)} Gwei</span></p>
        {txInfo.transactionIndex !== null && txInfo.transactionIndex !== undefined ? (
        <p><strong>트랜잭션 위치:</strong> {Number(txInfo.transactionIndex) + 1} 번째</p>
        ) : (
        <p><strong>트랜잭션 위치:</strong> 정보 없음</p>
        )}
      </div>
      )}
      </div>

      <div className="explorer-section">
        <h2>블록 정보 조회</h2>
        <input className="explorer-input" value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="Block Number" />
        <button className="explorer-button" onClick={fetchBlock}>조회</button>
        {blockInfo && (
          <div className="tx-info">
            <p><strong>블록 번호:</strong> {blockInfo.number}</p>
            <p><strong>블록 해시:</strong> <span className="tx-hash">{blockInfo.hash}</span></p>
            <p><strong>블록 생성 시간:</strong> {new Date(Number(blockInfo.timestamp) * 1000).toLocaleString()}</p>
            <p><strong>채굴자 주소:</strong> <span className="tx-hash">{blockInfo.miner}</span></p>
            <p><strong>실제 사용된 가스량 / 블록의 최대 가스량:</strong> {blockInfo.gasUsed} / {blockInfo.gasLimit} Gas</p>
            <p><strong>블록 크기:</strong> {blockInfo.size} bytes</p>
            <p><strong>블록 내부 트랜재션 수:</strong> {blockInfo.transactions.length}</p>
          </div>
        )}
      </div>

      <div className="explorer-section">
        <h2>지갑 정보</h2>
        <input className="explorer-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wallet Address" />
        <button className="explorer-button" onClick={fetchBalance}>잔액 조회</button>
        <button className="explorer-button" onClick={fetchTxListWithScanApi}>트랜잭션 내역</button>
        {balance && <p className="tx-amount">잔액: {balance} ETH</p>}
        {txList.length > 0 && (
        <div className="tx-list">
          <h3>트랜잭션 내역 (최근 {txList.length}건)</h3>
          {txList.map((tx: any) => (
          <div key={tx.hash} className="tx-list-item">
          <p><strong>
            <button
            onClick={() => setSelectedHash(tx.hash)}
            style={{ background: 'none', border: 'none', padding: 0, color:'#3498db', textDecoration: 'underline', cursor: 'pointer' }}
            >
            트랜잭션 해시:
            </button></strong> <span className="tx-hash">{tx.hash}</span></p>
            {selectedHash === tx.hash && <TxHashDetail hash={tx.hash} />}
          <p><strong>블록 번호:</strong> {tx.blockNumber}</p>
          <p><strong>거래 시간:</strong> {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}</p>
          <p><strong>송신자:</strong> <span className="tx-hash">{tx.from}</span></p>
          <p><strong>수신자:</strong> <span className="tx-hash">{tx.to}</span></p>
          <hr></hr>
        </div>
      ))}
    </div>
  )}
      </div>

      <div className="explorer-section">
        <h2>네트워크 상태 : {latestBlock ? ("정상") : ("오류")}</h2>
         {latestBlock ? (
      <div className="network-status">
        <p>블록 생성 주기: <span>{latestBlock.blockTime}초</span></p>
        <p>최신 블록 번호: <span>{latestBlock.latestBlockNumber}</span></p>
        <p>현재 수수료(Gwei): <span className="tx-gas">
        {(Number(latestBlock.gasPrice) / 1e9).toFixed(2)} Gwei
        </span></p>
      </div>
  ) : (
    <p className="loading">불러오는 중...</p>
  )}
      </div>
    </div>
  );
}

export default BlockchainExplorer;

