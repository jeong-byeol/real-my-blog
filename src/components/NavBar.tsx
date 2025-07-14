import React from 'react';
import {Link} from 'react-router-dom'
import './NavBar.css';

const NavBar = () => (
  <nav className="navbar">
    <div className="navbar-logo">My Blog</div>
    <div className="navbar-menu">
      <Link to="/">홈</Link>
      <Link to="/new">글쓰기</Link>
      <Link to="/metamask">MetaMask</Link>
      <Link to="/walletPage">지갑</Link>
      <Link to="/explorerPage">블록 익스플로어</Link>
      <Link to="/smartcontract">스마트컨트랙트</Link>
      <Link to="/NFTpage">NFT</Link>
      <Link to="/erc1155">ERC1155</Link>
    </div>
  </nav>
);

export default NavBar; 