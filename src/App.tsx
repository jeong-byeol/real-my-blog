import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import HomePage from './components/HomePage';
import EditorPage from './components/EditorPage';
import PostPage from './components/PostPage';

// 게시글 데이터 타입 정의
interface Post {
  id: string;
  title: string;
  content: string;
}

// 댓글 타입 정의
interface Comment {
  id: string;
  postId: string;
  text: string;
}

function App() {
  // 전역 상태: posts
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: '화폐의 역사', content: `...` },
    { id: '2', title: '화폐의 3대 기능', content: `...` },
  ]);

  // 전역 상태: comments
  const [comments, setComments] = useState<Comment[]>([]);

  // 다크 모드 여부를 관리하는 상태
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // 새 글 추가 함수
  const addPost = (title: string, content: string) => {
    const newId = (posts.length + 1).toString();
    const newPost: Post = { id: newId, title, content };
    setPosts(prev => [...prev, newPost]);
  };

  // 새 댓글 추가 함수
  const addComment = (postId: string, text: string) => {
    const newId = (comments.length + 1).toString();
    const newComment: Comment = { id: newId, postId, text };
    setComments(prev => [...prev, newComment]);
  };

  // 다크 모드 On/Off 토글 함수
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <Router>
      {/* darkMode가 true 이면 "App dark", false 이면 "App" */}
      <div className={`App${darkMode ? ' dark' : ''}`}>
        <Routes>
          {/* 홈: 게시글 목록 페이지 */}
          <Route
            path="/"
            element={
              <HomePage
                posts={posts}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            }
          />

          {/* 새 글 쓰기 페이지 */}
          <Route
            path="/new"
            element={
              <EditorPage
                addPost={addPost}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            }
          />

          {/* 게시글 상세 페이지 (PostPage) */}
          <Route
            path="/post/:id"
            element={
              <PostPage
                posts={posts}
                comments={comments}
                addComment={addComment}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            }
          />

          {/* 그 외 경로는 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

