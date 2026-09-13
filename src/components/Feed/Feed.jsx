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
}) {
  return (
    <main className="feed-page">
      <div className="feed-container">
        {/* FEED HEADER */}
        <div className="feed-header">
          <div>
            <h1>News Feed</h1>
            <p>
              See what's happening with your
              friends.
            </p>
          </div>

          <button
            type="button"
            className="feed-refresh-btn"
            onClick={() => window.location.reload()}
            title="Refresh feed"
          >
            ↻
          </button>
        </div>

        {/* CREATE POST */}
        <CreatePost
          currentUser={currentUser}
          onCreatePost={createPost}
          creating={creatingPost}
        />

        {/* ERROR */}
        {postError && (
          <div className="feed-error">
            {postError}
          </div>
        )}

        {/* POSTS */}
        <section className="posts-list">
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
                Be the first one to share
                something!
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
                deleting={
                  deletingPostId ===
                  post._id
                }
                liking={
                  likingPostId ===
                  post._id
                }
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default Feed;