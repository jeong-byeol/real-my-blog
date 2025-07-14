# Real My Blog - Web3 & Blockchain DApp

이 프로젝트는 React와 Web3를 사용하여 구축된 블록체인 기반 블로그 애플리케이션입니다. NFT 민팅, ERC1155 토큰 관리, 실시간 트랜잭션 모니터링 등의 기능을 제공합니다.

## 주요 기능

### 🎨 NFT 기능 (NFTpage.tsx)
- **NFT 민팅**: ERC721 토큰 민팅
- **소유자 조회**: 토큰ID로 소유자 주소 조회
- **메타데이터 조회**: NFT 메타데이터 및 이미지 표시
- **NFT 전송**: 다른 주소로 NFT 전송
- **전체 NFT 조회**: 발행된 모든 NFT 목록 조회

### 🪙 ERC1155 기능 (ERC1155page.tsx)
- **배치 민팅**: 여러 토큰을 한 번에 민팅
- **배치 잔액 조회**: 여러 주소의 토큰 잔액 일괄 조회
- **토큰 전송**: ERC1155 토큰 전송
- **승인 관리**: 다른 주소에 대한 전송 권한 승인
- **URI 조회**: 토큰 메타데이터 URI 조회

### 🔗 실시간 블록체인 이벤트 모니터링
- **Web3 이벤트 구독**: 클라이언트에서 직접 컨트랙트 이벤트 구독
- **실시간 업데이트**: Transfer, TransferSingle, TransferBatch 이벤트 실시간 모니터링
- **자동 UI 업데이트**: 블록체인 이벤트 발생 시 자동으로 UI 업데이트

### 💰 지갑 기능 (WalletPage.tsx)
- **지갑 생성**: 니모닉 기반 HD 지갑 생성
- **지갑 복구**: 니모닉으로 지갑 복구
- **잔액 조회**: 주소별 잔액 확인
- **토큰 전송**: 로컬 지갑 간 토큰 전송

### 🔍 블록체인 탐색기 (ExplorerPage.tsx)
- **트랜잭션 조회**: 트랜잭션 해시로 상세 정보 조회
- **블록 정보**: 블록 번호로 블록 정보 조회
- **주소 조회**: 지갑 주소의 잔액 및 트랜잭션 내역
- **네트워크 상태**: 최신 블록 정보 및 가스 가격

## 기술 스택

- **Frontend**: React, TypeScript, Web3.js
- **Blockchain**: Ethereum, Polygon, Kairos Network
- **Wallet**: MetaMask SDK
- **Styling**: CSS3

## 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd real-my-blog
npm install
```

### 2. React 앱 실행
```bash
npm start
```

앱이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 환경 설정

### 환경 변수 설정
`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
REACT_APP_PRIVATE_KEY=your_private_key_here
REACT_APP_POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### 네트워크 설정
- **Kairos Network**: `https://public-en-kairos.node.kaia.io`
- **Polygon**: `https://polygon-rpc.com`
- **Ethereum**: `https://eth.llamarpc.com`

## 사용 방법

### 1. 지갑 연결
- MetaMask 지갑을 설치하고 연결
- 네트워크 설정 확인 (Kairos Network 권장)

### 2. NFT 민팅
- NFTpage에서 이미지 번호와 수신자 주소 입력
- 민팅 버튼 클릭하여 NFT 생성

### 3. ERC1155 토큰 관리
- ERC1155page에서 토큰 민팅, 전송, 조회 기능 사용
- 배치 작업으로 효율적인 토큰 관리

### 4. 실시간 모니터링
- 블록체인 이벤트가 발생하면 자동으로 UI 업데이트
- Transfer, TransferSingle, TransferBatch 이벤트 실시간 모니터링

## 프로젝트 구조

```
real-my-blog/
├── src/
│   ├── components/
│   │   ├── NFTpage.tsx          # NFT 관리 페이지
│   │   ├── ERC1155page.tsx      # ERC1155 토큰 관리
│   │   ├── WalletPage.tsx       # 지갑 기능
│   │   ├── ExplorerPage.tsx     # 블록체인 탐색기
│   │   └── ...
│   ├── abi/
│   │   ├── FNFT.json           # ERC721 컨트랙트 ABI
│   │   └── Multi.json          # ERC1155 컨트랙트 ABI
│   └── ...
└── ...
```

## 컨트랙트 주소

- **ERC721 NFT 컨트랙트**: `0xA39fE2cf6dE605fB81FB45B60163367DD67F0F79`
- **ERC1155 Multi 토큰 컨트랙트**: `0xc395144FCCFF5A39cd9754BF2B6C425b91C1950D`

## 실시간 이벤트 모니터링

이 프로젝트는 서버 없이 클라이언트에서 직접 Web3를 사용하여 블록체인 이벤트를 구독합니다:

### 지원하는 이벤트
- **ERC721**: `Transfer` 이벤트
- **ERC1155**: `TransferSingle`, `TransferBatch` 이벤트

### 이벤트 처리
- 이벤트 발생 시 자동으로 UI 업데이트
- 최대 10개의 최근 이벤트 표시
- 이벤트 타입, 트랜잭션 해시, 송수신자, 토큰ID, 시간 정보 포함

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의사항

프로젝트에 대한 문의사항이나 버그 리포트는 Issues 섹션을 이용해주세요.
