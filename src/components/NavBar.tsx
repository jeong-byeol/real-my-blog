import React from 'react';
import {Link} from 'react-router-dom'
import './NavBar.css';

const NavBar = () => (
  <nav className="navbar">
    <div className="navbar-logo">My Blog</div>
    <div className="navbar-menu">
      <Link to="/">홈</Link>
      <Link to="/new">글쓰기</Link>
      <Link to="/wallet">지갑</Link>
    </div>
  </nav>
);

export default NavBar; 