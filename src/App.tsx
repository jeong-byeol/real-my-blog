import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import HomePage from './components/HomePage';
import EditorPage from './components/EditorPage';
import PostPage from './components/PostPage';
import WalletPage from './components/WalletPage';
import ExplorerPage from './components/ExplorerPage';
import Smartcontract from './components/Smartcontract';
import NFTpage from "./components/NFTpage";
import ERC1155page from './components/ERC1155page';
import MetamaskPage from './components/MetamaskPage';

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
    <Router>
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
          <Route path="/metamask" element={<MetamaskPage />} />
          <Route path="/walletPage" element={<WalletPage />} />
          <Route path="/ExplorerPage" element={<ExplorerPage />} />
          <Route path="/smartcontract" element={<Smartcontract />} />
          <Route path="/NFTpage" element={<NFTpage />} />
          <Route path="/erc1155" element={<ERC1155page />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
