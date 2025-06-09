// src/components/PostList.tsx
import React from 'react';
import PostCard from './PostCard';

interface PostListProps {
  posts: { id: string; title: string; content: string }[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => (
  <div>
    {posts.map(post => (
      <PostCard key={post.id} id={post.id} title={post.title} content={post.content} />
    ))}
  </div>
);

export default PostList;
