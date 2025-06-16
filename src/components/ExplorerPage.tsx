import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import NavBar from './NavBar';

const web3 = new Web3('https://rpc-amoy.polygon.technology'); 

const BlockchainExplorer = () => {
  const [txHash, setTxHash] = useState('');
  const [txInfo, setTxInfo] = useState<any | null>(null); 
  const [blockNumber, setBlockNumber] = useState('');
  const [blockInfo, setBlockInfo] = useState<any | null>(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [txList, setTxList] = useState<any[]>([]); 
  const [latestBlock, setLatestBlock] = useState<{
    blockTime: number;
    latestBlockNumber: number;
    gasPrice: string;
  } | null>(null);

  const safeStringify = (data: any) =>
  JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2);


  const fetchTransaction = async () => {
    try {
      const tx = await web3.eth.getTransaction(txHash);
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      setTxInfo({ ...tx, status: receipt.status });
    } catch (err) {
      alert('트랜잭션 정보를 불러오지 못했습니다.');
    }
  };

  const fetchBlock = async () => {
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

  const fetchTxList = async () => {
    try {
      const latest = await web3.eth.getBlock('latest', true);
      const latestTx = await Promise.all(
      latest.transactions.map((tx: any) => web3.eth.getTransaction(tx.hash)));
      const resolved = await Promise.all(latestTx);
      setTxList(resolved.filter(tx => tx.from === address || tx.to === address));
    } catch (err) {
      alert('트랜잭션 목록을 불러오지 못했습니다.');
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

  return (
    <div className="p-4 space-y-4">
        <NavBar />
      <div>
        <h2>트랜잭션 조회</h2>
        <input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Tx Hash" />
        <button onClick={fetchTransaction}>조회</button>
        {txInfo && <pre>{safeStringify(txInfo)}</pre>}
      </div>

      <div>
        <h2>블록 정보 조회</h2>
        <input value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="Block Number" />
        <button onClick={fetchBlock}>조회</button>
        {blockInfo && <pre>{safeStringify(blockInfo)}</pre>}
      </div>

      <div>
        <h2>지갑 정보</h2>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Wallet Address" />
        <button onClick={fetchBalance}>잔액 조회</button>
        <button onClick={fetchTxList}>트랜잭션 내역</button>
        {balance && <p>잔액: {balance} ETH</p>}
        {txList.length > 0 && <pre>{safeStringify(txList)}</pre>}
      </div>

      <div>
        <h2>네트워크 상태 : {latestBlock ? ("정상") : ("오류")}</h2>
         {latestBlock ? (
      <div className="text-sm text-gray-700 space-y-1">
        <p>블록 생성 주기: <span className="font-mono">{latestBlock.blockTime}초</span></p>
        <p>최신 블록 번호: <span className="font-mono">{latestBlock.latestBlockNumber}</span></p>
        <p>현재 수수료(Gwei): <span className="font-mono">
        {(Number(latestBlock.gasPrice) / 1e9).toFixed(2)} Gwei
        </span></p>
      </div>
  ) : (
    <p className="text-gray-500 text-sm">불러오는 중...</p>
  )}
      </div>
    </div>
  );
}

export default BlockchainExplorer;

