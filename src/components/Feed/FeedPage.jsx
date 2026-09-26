import CreateFeedPost from "./CreateFeedPost";
import FeedCard from "./FeedCard";

function FeedPage({
  currentUser,
  posts,
  loadingPosts,
  creatingPost,
  deletingPostId,
  likingPostId,
  feedError,
  createPost,
  deletePost,
  likePost,
  loadFeed,
  openProfile,
  logout,
  openChatView,
}) {
  const initial =
    currentUser?.username?.charAt(0).toUpperCase() ||
    "U";

  return (
    <>
      <aside className="feed-side-panel">
        <div className="feed-side-header">
          <h2>Feed</h2>
          <p className="feed-side-note">
            Photos and text. Anyone in mairochat can post.
          </p>
        </div>

        <button
          type="button"
          className="feed-nav-profile"
          onClick={openProfile}
        >
          <div className="feed-nav-avatar">
            {currentUser?.photo ? (
              <img src={currentUser.photo} alt="" />
            ) : (
              initial
            )}
          </div>

          <div>
            <strong>
              @{currentUser?.username || "user"}
            </strong>
            <span>My Profile</span>
          </div>
        </button>

        <button
          type="button"
          className="feed-back-chat-btn"
          onClick={openChatView}
        >
          Back to Chats
        </button>

        <button
          type="button"
          className="feed-logout-btn"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      <main className="feed-page">
        <div className="feed-container">
          <header className="feed-header">
            <div>
              <h1>Feed</h1>
              <p>Share a photo or a few words.</p>
            </div>

            <button
              type="button"
              className="feed-refresh-btn"
              onClick={() => loadFeed?.()}
              aria-label="Refresh feed"
            >
              ↻
            </button>
          </header>

          <CreateFeedPost
            currentUser={currentUser}
            onCreatePost={createPost}
            creating={creatingPost}
          />

          {feedError && (
            <div className="feed-error" role="alert">
              {feedError}
            </div>
          )}

          <section className="posts-list" aria-label="Feed">
            {loadingPosts && posts.length === 0 ? (
              <div className="feed-loading">
                <p>Loading feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-feed">
                <h2>No posts yet</h2>
                <p>
                  Be the first to share a photo or a note.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <FeedCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  onDelete={deletePost}
                  onLike={likePost}
                  deleting={
                    deletingPostId === post._id
                  }
                  liking={likingPostId === post._id}
                />
              ))
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default FeedPage;
