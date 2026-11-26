```tsx
import React, { useEffect, useState } from 'react';

type Comment = {
  id: string;
  text: string;
};

type Post = {
  id: string;
  title: string;
  comments: Comment[];
};

export default function PostDashboard({ posts }: { posts: Post[] }) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id);
  const [showComments, setShowComments] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | undefined>();

  useEffect(() => {
    const post = posts.find((p) => p.id === selectedPostId);
    setSelectedPost(post);
  }, [selectedPostId]);

  function CommentsPanel() {
    const [draft, setDraft] = useState('');

    useEffect(() => {
      setDraft('');
    }, [selectedPostId]);

    if (!selectedPost || !showComments) {
      return null;
    }

    return (
      <section>
        <h3>Comments for {selectedPost.title}</h3>

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='Write comment'
        />

        <ul>
          {selectedPost.comments.map((comment) => (
            <li key={Math.random()}>{comment.text}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div>
      <h2>Posts</h2>

      <button onClick={() => setShowComments(!showComments)}>
        Toggle comments
      </button>

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <button onClick={() => setSelectedPostId(post.id)}>
              {post.title}
            </button>
          </li>
        ))}
      </ul>

      <CommentsPanel />
    </div>
  );
}
```
