function PostCard({
  post,
  currentUser,
  onDelete,
  onLike,
  deleting,
  liking,
}) {
  const author = post.author || {};

  const currentUserId = String(
    currentUser?.id ||
      currentUser?._id ||
      ""
  );

  const authorId = String(
    author._id ||
      author.id ||
      ""
  );

  const isOwnPost =
    currentUserId === authorId;

  const likes = Array.isArray(post.likes)
    ? post.likes
    : [];

  const isLiked = likes.some(
    (userId) =>
      String(userId) === currentUserId
  );

  const formattedTime = post.createdAt
    ? new Date(
        post.createdAt
      ).toLocaleString([], {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <article className="post-card">
      {/* POST HEADER */}
      <div className="post-header">
        <div className="post-author">
          <div className="post-avatar">
            {author.photo ? (
              <img
                src={author.photo}
                alt={`@${author.username}`}
              />
            ) : (
              author.username
                ?.charAt(0)
                .toUpperCase() || "U"
            )}
          </div>

          <div className="post-author-info">
            <strong>
              @{author.username || "user"}
            </strong>

            <span>
              {formattedTime}
            </span>
          </div>
        </div>

        {isOwnPost && (
          <button
            type="button"
            className="post-delete-btn"
            onClick={() =>
              onDelete(post._id)
            }
            disabled={deleting}
            title="Delete post"
          >
            {deleting ? "..." : "⋮"}
          </button>
        )}
      </div>

      {/* POST TEXT */}
      {post.text && (
        <div className="post-text">
          {post.text}
        </div>
      )}

      {/* POST IMAGE */}
      {post.image && (
        <div className="post-image-container">
          <img
            src={post.image}
            alt="Post"
            className="post-image"
          />
        </div>
      )}

      {/* POST ACTIONS */}
      <div className="post-actions">
        <button
          type="button"
          className={`post-action-btn ${
            isLiked
              ? "liked"
              : ""
          }`}
          onClick={() =>
            onLike(post._id)
          }
          disabled={liking}
        >
          {isLiked ? "❤️" : "🤍"}

          <span>
            {likes.length}
          </span>
        </button>

        <button
          type="button"
          className="post-action-btn"
          disabled
          title="Comments coming soon"
        >
          💬
          <span>0</span>
        </button>

        <button
          type="button"
          className="post-action-btn"
          disabled
          title="Share coming soon"
        >
          ↗️
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}

export default PostCard;