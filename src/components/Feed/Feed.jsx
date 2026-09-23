import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

function Feed({
  currentUser,
  posts,
  loadingPosts,
  creatingPost,
  deletingPostId,
  likingPostId,
  postError,
  createPost,
  deletePost,
  likePost,
  loadPosts,
}) {
  return (
    <main className="feed-page">
      <div className="feed-container">
        <header className="feed-header">
          <div>
            <h1>Feed</h1>
            <p>
              Share updates with friends. Every post
              auto-deletes after 7 days.
            </p>
          </div>

          <button
            type="button"
            className="feed-refresh-btn"
            onClick={() => loadPosts?.()}
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            ↻
          </button>
        </header>

        <div
          className="feed-policy-banner"
          role="note"
        >
          <strong>Auto-delete:</strong> Posts stay
          visible for 7 days, then are removed
          automatically. This is the only option.
        </div>

        <CreatePost
          currentUser={currentUser}
          onCreatePost={createPost}
          creating={creatingPost}
        />

        {postError && (
          <div className="feed-error" role="alert">
            {postError}
          </div>
        )}

        <section
          className="posts-list"
          aria-label="Posts"
        >
          {loadingPosts ? (
            <div className="feed-loading">
              <div className="feed-loading-spinner">
                ⟳
              </div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <div className="empty-feed-icon">
                📰
              </div>
              <h2>No posts yet</h2>
              <p>
                Be the first to share something.
                Posts disappear after 7 days.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                onDelete={deletePost}
                onLike={likePost}
                deleting={deletingPostId === post._id}
                liking={likingPostId === post._id}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default Feed;
