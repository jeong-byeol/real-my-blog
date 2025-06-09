// src/components/PostPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import PostContent from './PostContent';
import Comments from './Comments';

interface PostPageProps {
  posts: { id: string; title: string; content: string }[];
  comments: { id: string; postId: string; text: string }[];
  addComment: (postId: string, text: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const PostPage: React.FC<PostPageProps> = ({ posts, comments, addComment, darkMode, toggleDarkMode }) => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div>
        <NavBar />
        <h2>잘못된 접근입니다.</h2>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div style={{ display: 'flex', maxWidth: 1200, margin: '32px auto' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 32 }}>
          <PostContent postId={id} posts={posts} />
          <Comments postId={id} comments={comments} addComment={addComment} />
        </main>
      </div>
    </div>
  );
};

export default PostPage;