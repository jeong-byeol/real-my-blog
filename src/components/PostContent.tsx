// src/components/PostContent.tsx
import React from 'react';

interface PostContentProps {
  postId: string;
  posts: { id: string; title: string; content: string }[];
}

const PostContent: React.FC<PostContentProps> = ({ postId, posts }) => {
  // 전달받은 postId로 posts 배열 탐색
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return (
      <div>
        <h2>글을 찾을 수 없습니다.</h2>
        <p>해당 ID의 글이 존재하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>글 제목: {post.title}</h2>
      <p>{post.content}</p>
    </div>
  );
};

export default PostContent;
