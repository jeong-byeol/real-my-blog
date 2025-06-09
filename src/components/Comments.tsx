// src/components/Comments.tsx
import React, { useState } from 'react';

interface CommentData {
  id: string;
  postId: string;
  text: string;
}

interface CommentsProps {
  postId: string;
  comments: CommentData[];
  addComment: (postId: string, text: string) => void;
}

const Comments: React.FC<CommentsProps> = ({ postId, comments, addComment }) => {
  // 댓글 입력용 로컬 상태
  const [newText, setNewText] = useState('');

  // 현재 postId에 달린 댓글만 필터링
  const filtered = comments.filter(c => c.postId === postId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newText.trim() === '') {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    // addComment 함수 호출 -> 상위(App.tsx)의 상태 업데이트
    addComment(postId, newText);
    setNewText(''); // 입력란 초기화
  };

  return (
    <div>
      <h3>댓글</h3>

      {filtered.length === 0 ? (
        <p>아직 등록된 댓글이 없습니다.</p>
      ) : (
        <ul>
          {filtered.map(c => (
            <li key={c.id}>{c.text}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>새 댓글: </label>
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="댓글을 입력하세요"
          />
        </div>
        <button type="submit">댓글 등록</button>
      </form>
    </div>
  );
};

export default Comments;


