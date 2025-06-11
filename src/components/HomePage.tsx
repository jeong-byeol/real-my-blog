// src/components/HomePage.tsx
import React from 'react';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import PostList from './PostList';

interface HomePageProps {
  posts: { id: string; title: string; content: string }[];
}

const HomePage: React.FC<HomePageProps> = ({ posts }) => (
  <div>
    <NavBar />
    <div style={{ display: 'flex', maxWidth: 1200, margin: '32px auto' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 32 }}>
        <h2>홈페이지</h2>
        <PostList posts={posts} />
      </main>
    </div>
  </div>
);


export default HomePage;
