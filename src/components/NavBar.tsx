import React from 'react';
import './NavBar.css';

const NavBar = () => (
  <nav className="navbar">
    <div className="navbar-logo">My Blog</div>
    <div className="navbar-menu">
      <a href="/">홈</a>
      <a href="/new">글쓰기</a>
      <a href="/wallet">지갑</a>
    </div>
  </nav>
);

export default NavBar; 