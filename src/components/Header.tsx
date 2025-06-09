// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => (
  <header className={darkMode ? 'dark' : ''}>
    <nav>
      <Link to="/">홈</Link>
      <Link to="/new">새 게시물 작성</Link>
      {/* 다크 모드 토글 버튼 */}
      <button 
        type="button" 
        onClick={toggleDarkMode} 
        className="dark-toggle-btn"
      >
        {darkMode ? '라이트 모드' : '다크 모드'}
      </button>
    </nav>
  </header>
);

export default Header;

