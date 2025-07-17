import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import stakingABI from '../abi/staking.json';
import MytokenABI from '../abi/Mytoken.json';
import './Staking.css';

interface StakingInfo {
  amount: string;
  timestamp: string;
  rewards: string;
}

interface StakingEvent {
  user: string;
  amount: string;
  timestamp: string;
  blockNumber: number;
}

const Staking: React.FC = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [stakingContract, setStakingContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<Contract | null>(null);
  
  const [stakingAmount, setStakingAmount] = useState<string>('');
  const [unstakingAmount, setUnstakingAmount] = useState<string>('');
  const [userStakingInfo, setUserStakingInfo] = useState<StakingInfo | null>(null);
  const [pendingRewards, setPendingRewards] = useState<string>('0');
  const [rewardRate, setRewardRate] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [userAddress, setUserAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stakingEvents, setStakingEvents] = useState<StakingEvent[]>([]);

  // 스테이킹 컨트랙트 주소
  const STAKING_CONTRACT_ADDRESS = '0x9AA32b9B24e220A48E3CEd7FECF1e5BaCC41DE42'; 
  const TOKEN_CONTRACT_ADDRESS = '0x3e041CeAe50be00a68Fd34BA81C30A65D5b95f26';

  // MetaMask 연결
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setUserAddress(address);
        
        // 컨트랙트 인스턴스 생성
        const stakingContract = new Contract(
          STAKING_CONTRACT_ADDRESS,
          stakingABI,
          signer
        );
        setStakingContract(stakingContract);

        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          MytokenABI,
          signer
        );
        setTokenContract(tokenContract);
        
        
        await loadStakingData();
      } else {
        setError('MetaMask가 설치되지 않았습니다.');
      }
    } catch (error) {
      setError('지갑 연결 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // Staked 이벤트 조회
  const loadStakingEvents = async () => {
    if (!stakingContract || !userAddress) return;
    
    try {
      // Staked 이벤트 필터 생성
      const filter = stakingContract.filters.Staked(userAddress);
      
      // 최근 100개 블록에서 이벤트 조회
      const currentBlock = await provider?.getBlockNumber();
      const fromBlock = currentBlock ? Math.max(0, currentBlock - 10000) : 0;
      
      const events = await stakingContract.queryFilter(filter, fromBlock);
      
      const stakingEventsData: StakingEvent[] = await Promise.all(
        events.map(async (event) => {
          const block = await provider?.getBlock(event.blockNumber);
          // ethers v6에서는 event.args 대신 event.data를 파싱해야 함
          const decodedEvent = stakingContract.interface.parseLog(event);
          return {
            user: decodedEvent?.args?.[0] || '',
            amount: formatEther(decodedEvent?.args?.[1] || 0),
            timestamp: block ? new Date(Number(block.timestamp) * 1000).toLocaleString() : '',
            blockNumber: event.blockNumber
          };
        })
      );
      
      setStakingEvents(stakingEventsData.reverse()); // 최신 순으로 정렬
    } catch (error) {
      console.error('스테이킹 이벤트 로드 중 오류:', error);
    }
  };

  // 스테이킹 데이터 로드
  const loadStakingData = async () => {
    if (!stakingContract || !tokenContract || !userAddress) return;
    
    try {
      setIsLoading(true);
      
      // 사용자 스테이킹 정보 조회
      const stakingInfo = await stakingContract.stakes(userAddress);
      setUserStakingInfo({
        amount: formatEther(stakingInfo.amount),
        timestamp: new Date(Number(stakingInfo.timestamp) * 1000).toLocaleString(),
        rewards: formatEther(stakingInfo.rewards)
      });
      
      // 대기 중인 보상 조회
      const pending = await stakingContract.getPendingRewards(userAddress);
      setPendingRewards(formatEther(pending));
      
      // 보상률 조회
      const rate = await stakingContract.rewardRatePerSecond();
      setRewardRate(formatEther(rate));

      // 토큰 잔액 조회
      const balance = await tokenContract.balanceOf(userAddress);
      setTokenBalance(formatEther(balance));

      // 스테이킹 이벤트 로드
      await loadStakingEvents();
      
    } catch (error) {
      setError('데이터 로드 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  // 스테이킹 (Permit 방식)
  const handleStakeWithPermit = async () => {
    if (!stakingContract || !tokenContract || !stakingAmount || !signer) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const amount = parseEther(stakingAmount);
      console.log(amount);
      // 토큰 잔액 확인
      const balance = await tokenContract.balanceOf(userAddress);
      if (balance < amount) {
        setError('토큰 잔액이 부족합니다.');
        return;
      }
      
      const deadline = Math.floor(Date.now() / 1000) + 3600; // permit 서명 만료 시간
      
      // Permit 서명 생성
      const domain = {
        name: 'MyToken',
        version: '1',
        chainId: 1001,
        verifyingContract: TOKEN_CONTRACT_ADDRESS
      };
      
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };
      
      const nonce = await tokenContract.nonces(userAddress);
      const message = {
        owner: userAddress,
        spender: STAKING_CONTRACT_ADDRESS,
        value: amount,
        nonce: nonce,
        deadline: deadline
      };
      
      const signature = await signer.signTypedData(domain, types, message);
      // ethers v6에서는 signature를 직접 사용하거나 다른 방식으로 처리
      const signatureBytes = signature.slice(2); // 0x 제거
      const r = '0x' + signatureBytes.slice(0, 64);
      const s = '0x' + signatureBytes.slice(64, 128);
      const v = parseInt(signatureBytes.slice(128, 130), 16);
      
      // Permit를 사용한 스테이킹
      const stakeTx = await stakingContract.stakeWithPermit(amount, deadline, v, r, s);
      await stakeTx.wait();
      
      setStakingAmount('');
      await loadStakingData();
      alert('스테이킹이 완료되었습니다!');
      
    } catch (error) {
      setError('스테이킹 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 스테이킹 해제
  const handleUnstake = async () => {
    if (!stakingContract || !unstakingAmount) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const amount = parseEther(unstakingAmount);
      const unstakeTx = await stakingContract.unstake(amount);
      await unstakeTx.wait();
      
      setUnstakingAmount('');
      await loadStakingData();
      alert('스테이킹 해제가 완료되었습니다!');
      
    } catch (error) {
      setError('스테이킹 해제 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 보상 청구
  const handleClaimRewards = async () => {
    if (!stakingContract) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const claimTx = await stakingContract.claimRewards();
      await claimTx.wait();
      
      await loadStakingData();
      alert('보상 청구가 완료되었습니다!');
      
    } catch (error) {
      setError('보상 청구 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 지갑 연결 상태 확인
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          loadStakingData();
        } else {
          setUserAddress('');
          setStakingContract(null);
        }
      });
    }
  }, []);

  return (
    <div className="staking-container">
      <h1>스테이킹</h1>
      
      {!userAddress ? (
        <div className="connect-section">
          <button onClick={connectWallet} className="connect-button">
            MetaMask 연결
          </button>
        </div>
      ) : (
        <div className="staking-content">
          <div className="user-info">
            <p>연결된 주소: {userAddress}</p>
            <p>토큰 잔액: {tokenBalance} TOKEN</p>
            <p>초당 보상률: {rewardRate} TOKEN</p>
          </div>

          {userStakingInfo && (
            <div className="staking-info">
              <h3>내 스테이킹 정보</h3>
              <p>스테이킹된 금액: {userStakingInfo.amount} TOKEN</p>
              <p>스테이킹 시작일: {userStakingInfo.timestamp}</p>
              <p>누적 보상: {userStakingInfo.rewards} TOKEN</p>
              <p>대기 중인 보상: {pendingRewards} TOKEN</p>
            </div>
          )}

          <div className="staking-actions">
            <div className="action-section">
              <h3>스테이킹</h3>
              <input
                type="number"
                placeholder="스테이킹할 금액"
                value={stakingAmount}
                onChange={(e) => setStakingAmount(e.target.value)}
                disabled={isLoading}
              />
              <button onClick={handleStakeWithPermit} disabled={isLoading || !stakingAmount}>
                {isLoading ? '처리 중...' : 'Permit로 스테이킹'}
              </button>
            </div>

            <div className="action-section">
              <h3>스테이킹 해제</h3>
              <input
                type="number"
                placeholder="해제할 금액"
                value={unstakingAmount}
                onChange={(e) => setUnstakingAmount(e.target.value)}
                disabled={isLoading}
              />
              <button onClick={handleUnstake} disabled={isLoading || !unstakingAmount}>
                {isLoading ? '처리 중...' : '스테이킹 해제'}
              </button>
            </div>

            <div className="action-section">
              <h3>보상 관리</h3>
              <button onClick={handleClaimRewards} disabled={isLoading || parseFloat(pendingRewards) === 0}>
                {isLoading ? '처리 중...' : `보상 청구 (${pendingRewards} TOKEN)`}
              </button>
              <button onClick={loadStakingData} disabled={isLoading}>
                {isLoading ? '새로고침 중...' : '데이터 새로고침'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* 스테이킹 히스토리 */}
          <div className="staking-history">
            <h3>스테이킹 히스토리</h3>
            {stakingEvents.length > 0 ? (
              <div className="history-list">
                {stakingEvents.map((event, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <span className="history-amount">+{event.amount} TOKEN</span>
                      <span className="history-time">{event.timestamp}</span>
                    </div>
                    <div className="history-details">
                      <span className="history-block">블록: {event.blockNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">아직 스테이킹 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Staking;
