import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import HomePage from './components/HomePage';
import EditorPage from './components/EditorPage';
import PostPage from './components/PostPage';
import WalletPage from './components/WalletPage';
import ExplorerPage from './components/ExplorerPage';
import Smartcontract from './components/Smartcontract';

interface Post {
  id: string;
  title: string;
  content: string;
}

interface Comment {
  id: string;
  postId: string;
  text: string;
}

function App() {
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: '화폐의 역사', content: `...` },
    { id: '2', title: '화폐의 3대 기능', content: `...` },
  ]);
  const [comments, setComments] = useState<Comment[]>([]);

  const addPost = (title: string, content: string) => {
    const newId = (posts.length + 1).toString();
    const newPost: Post = { id: newId, title, content };
    setPosts(prev => [...prev, newPost]);
  };

  const addComment = (postId: string, text: string) => {
    const newId = (comments.length + 1).toString();
    const newComment: Comment = { id: newId, postId, text };
    setComments(prev => [...prev, newComment]);
  };

  return (
    <Router basename="/real-my-blog">
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage posts={posts} />} />
          <Route path="/new" element={<EditorPage addPost={addPost} />} />
          <Route
            path="/post/:id"
            element={
              <PostPage
                posts={posts}
                comments={comments}
                addComment={addComment}
              />
            }
          />
          <Route path="/walletPage" element={<WalletPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/ExplorerPage" element={<ExplorerPage />} />
          <Route path="/smartcontract" element={<Smartcontract />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
