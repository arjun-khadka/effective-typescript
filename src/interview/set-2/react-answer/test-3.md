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
  // ISSUE:
  // Initial state is based on props.
  // If posts changes later, selectedPostId may become stale or invalid.

  const [showComments, setShowComments] = useState(true);

  const [selectedPost, setSelectedPost] = useState<Post | undefined>();
  // ISSUE:
  // selectedPost is derived from posts + selectedPostId.
  // We should keep one source of truth: selectedPostId.
  // If we store both selectedPostId and selectedPost,
  // they can get out of sync.
  // Better:
  // const selectedPost = posts.find((p) => p.id === selectedPostId);

  useEffect(() => {
    const post = posts.find((p) => p.id === selectedPostId);
    setSelectedPost(post);
  }, [selectedPostId]);
  // ISSUE:
  // posts is missing from dependencies.
  //
  // BIGGER ISSUE:
  // This effect is unnecessary synchronization.
  // selectedPost can be calculated during render.

  function CommentsPanel() {
    // ISSUE:
    // Component declared inside parent.
    // This creates a new component type every parent render.
    // React may remount it and reset its local state.
    // Move it outside the parent component.

    const [draft, setDraft] = useState('');

    useEffect(() => {
      setDraft('');
    }, [selectedPostId]);
    // ISSUE:
    // This effect is used to reset local state.
    // Better approach: model component identity with key={selectedPost.id}.

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
            // ISSUE:
            // Math.random() creates a new key every render.
            // React will remount this item every time.
            // Use comment.id instead.
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
        {/* MINOR ISSUE:
            Functional update is safer:
            setShowComments(v => !v) */}
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
      {/* ISSUE:
          Because CommentsPanel is declared inside PostDashboard,
          this usage can remount unexpectedly across parent renders. */}
    </div>
  );
}
```

```txt

+--------------------------------------------------+
| Posts                                            |
|                                                  |
| [ Toggle comments ]                              |
|                                                  |
| Posts list:                                      |
|                                                  |
|  [ React Basics ]                                |
|  [ TypeScript Tips ]                             |
|  [ Advanced React ]                              |
|                                                  |
| ------------------------------------------------ |
|                                                  |
| Comments for React Basics                        |
|                                                  |
| [ Write comment ______________________ ]         |
|                                                  |
| Comments:                                        |
|   - Great post                                   |
|   - Very helpful                                 |
|   - Needs more examples                          |
+--------------------------------------------------+


```

<details>
<summary><strong>Expected Findings</strong></summary>

1. `selectedPost` is derived state and should not be stored separately. `selectedPost` is derived from `posts` and `selectedPostId`. `selectedPostId` is the real state because it represents what the user selected. `selectedPost` can always be calculated with `posts.find((p) => p.id === selectedPostId)`. Storing both creates two sources of truth that must stay synchronized. Better to keep only `selectedPostId` in state and derive `selectedPost` during render.

2. The `useEffect` that sets `selectedPost` is unnecessary. The effect is only synchronizing derived state. Since `selectedPost` can be calculated directly from `posts` and `selectedPostId`, the effect adds extra render cycles, dependency risk, and synchronization complexity. Better to remove the effect and calculate `selectedPost` during render.

3. `posts` is missing from the `useEffect` dependency array. The effect uses both `posts` and `selectedPostId`, but only lists `selectedPostId`. If `posts` changes, `selectedPost` may stay stale. However, the bigger issue is that the effect should not exist because `selectedPost` should be derived during render.

4. `CommentsPanel` is declared inside `PostDashboard`. Every time `PostDashboard` renders, a new `CommentsPanel` function is created. React treats component function identity as component type. Because the child component type can change, React may remount `CommentsPanel` instead of just re-rendering it. Remounting resets local state like the `draft` input. Better to move `CommentsPanel` outside `PostDashboard`.

5. `Math.random()` should not be used as a key. `Math.random()` creates a new key every render. React uses keys to preserve item identity across renders. With random keys, React thinks every comment is a new item, so it throws away the old list items and mounts new ones. This can reset local row state, lose focus, restart animations, and cause unnecessary DOM work. Use `comment.id` instead.

6. The `draft` reset effect is a code smell. `useEffect(() => setDraft(""), [selectedPostId])` is synchronizing local state manually when selected post changes. If the desired behavior is to reset the draft when the selected post changes, a cleaner approach is to model identity with `key={selectedPost.id}` on `CommentsPanel`. Different key means different component instance, so React resets the local state intentionally.

7. `selectedPostId` initialized from `posts[0]?.id` can become stale if `posts` changes. `useState(posts[0]?.id)` only uses the initial value on the first render. If the `posts` prop later changes to a different list, `selectedPostId` may point to a post that no longer exists. This may be acceptable if preserving selection is intended, but the component should handle `selectedPost` being undefined or reset the selected id when the current id is no longer valid.

</details>

<details>
<summary><strong>Bonus</strong></summary>

8. `showComments` state placement can be questioned. If only the comments panel cares about show/hide behavior, this state might be moved closer to the comments area. If the parent needs to control layout or visibility, keeping it in the parent is fine. This is not necessarily a bug, but it tests state ownership thinking.

9. `setShowComments(!showComments)` can use a functional update. Since the next value depends on the previous value, `setShowComments((v) => !v)` is safer and avoids stale closure style mistakes. This is a minor improvement, not the main issue.

10. `selectedPost` calculation may not need `useMemo`. If the posts list is small, `const selectedPost = posts.find(...)` is simple and fine. `useMemo` is only useful if the list is large, the calculation is expensive, or stable identity matters downstream. A strong candidate may say: derive it first, memoize only if needed.

11. Conditional rendering can also cause remounting. If `showComments && <CommentsPanel />` becomes false, `CommentsPanel` unmounts. When it becomes true again, it mounts fresh and local state resets. This may be desired, but the candidate should understand that hiding by conditional rendering is different from merely re-rendering.

12. This example is mainly about component modeling, not just dependency arrays. A strong candidate should identify the deeper design issues: too much duplicated state, unnecessary effects, component identity problems, unstable keys, and unclear state ownership. The best fix is not “add more dependencies”; it is to simplify the data model and preserve intentional identity.

</details>

<details>
<summary><strong>Notes</strong></summary>

> Remount means React discards the old component instance and creates a new one, so local state/effects/DOM continuity are reset.

</details>
