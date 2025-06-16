import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import './TxhashDetail.css';

const web3 = new Web3('https://polygon-rpc.com');

interface TxHashDetailProps {
  hash: string;
}

const TxHashDetail: React.FC<TxHashDetailProps> = ({ hash }) => {
  const [txInfo, setTxInfo] = useState<any | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const tx = await web3.eth.getTransaction(hash);
        const receipt = await web3.eth.getTransactionReceipt(hash);
        setTxInfo({ ...tx, status: receipt.status });
      } catch (err) {
        console.error('트랜잭션 정보를 불러오지 못했습니다.');
      }
    };
    if (hash) fetchTx();
  }, [hash]);

  if (!txInfo) return null;

  return (
    <div className="tx-detail-container">
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
        <hr></hr>
    </div>
  );
};

export default TxHashDetail;
