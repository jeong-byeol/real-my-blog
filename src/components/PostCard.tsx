import React from 'react';
import { Link } from 'react-router-dom';
import './PostCard.css';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
}

const PostCard: React.FC<PostCardProps> = ({ id, title, content }) => (
  <div className="post-card">
    <Link to={`/post/${id}`}>
      <h3>{title}</h3>
      <p>{content.slice(0, 60)}...</p>
    </Link>
  </div>
);

export default PostCard; 