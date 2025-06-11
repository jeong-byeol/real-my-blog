// src/components/EditorPage.tsx
import React from 'react';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import PostEditor from './PostEditor';

interface EditorPageProps {
  addPost: (title: string, content: string) => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ addPost }) => (
  <div>
    <NavBar />
    <div style={{ display: 'flex', maxWidth: 1200, margin: '32px auto' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 32 }}>
        <h2>새 글 작성</h2>
        <PostEditor addPost={addPost} />
      </main>
    </div>
  </div>
);


export default EditorPage;
