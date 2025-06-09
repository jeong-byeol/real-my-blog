// src/components/PostEditor.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PostEditorProps {
  addPost: (title: string, content: string) => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ addPost }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '' || content.trim() === '') {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    addPost(title, content);
    // 글을 추가한 뒤 홈으로 이동
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>제목: </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
        />
      </div>
      <div>
        <label>내용: </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="본문을 입력하세요"
        />
      </div>
      <button type="submit">작성</button>
    </form>
  );
};

export default PostEditor;