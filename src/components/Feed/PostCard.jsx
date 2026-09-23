function getTimeLeftLabel(expiresAt) {
  if (!expiresAt) {
    return "Deletes in 7 days";
  }

  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffMs = end - now;

  if (diffMs <= 0) {
    return "Deleting soon";
  }

  const totalHours = Math.ceil(
    diffMs / (1000 * 60 * 60)
  );

  if (totalHours < 24) {
    if (totalHours <= 1) {
      return "Deletes in under 1 hour";
    }

    return `Deletes in ${totalHours} hours`;
  }

  const days = Math.ceil(totalHours / 24);

  if (days === 1) {
    return "Deletes tomorrow";
  }

  return `Deletes in ${days} days`;
}

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
    currentUser?.id || currentUser?._id || ""
  );

  const authorId = String(
    author._id || author.id || ""
  );

  const isOwnPost = currentUserId === authorId;

  const likes = Array.isArray(post.likes)
    ? post.likes
    : [];

  const isLiked = likes.some(
    (userId) => String(userId) === currentUserId
  );

  const formattedTime = post.createdAt
    ? new Date(post.createdAt).toLocaleString([], {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const expiryLabel = getTimeLeftLabel(
    post.expiresAt
  );

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this post now? Otherwise it will auto-delete after 7 days."
    );

    if (!confirmed) {
      return;
    }

    await onDelete(post._id);
  }

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="post-avatar">
            {author.photo ? (
              <img
                src={author.photo}
                alt={`@${author.username}`}
              />
            ) : (
              author.username?.charAt(0).toUpperCase() ||
              "U"
            )}
          </div>

          <div className="post-author-info">
            <strong>
              @{author.username || "user"}
            </strong>
            <span>{formattedTime}</span>
          </div>
        </div>

        {isOwnPost && (
          <button
            type="button"
            className="post-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete post now"
            aria-label="Delete post now"
          >
            {deleting ? "..." : "🗑"}
          </button>
        )}
      </div>

      {post.text && (
        <div className="post-text">{post.text}</div>
      )}

      {post.image && (
        <div className="post-image-container">
          <img
            src={post.image}
            alt="Post"
            className="post-image"
          />
        </div>
      )}

      <div className="post-expiry-bar">
        <span>{expiryLabel}</span>
      </div>

      <div className="post-actions">
        <button
          type="button"
          className={`post-action-btn ${
            isLiked ? "liked" : ""
          }`}
          onClick={() => onLike(post._id)}
          disabled={liking}
          aria-label={
            isLiked ? "Unlike post" : "Like post"
          }
        >
          {isLiked ? "❤️" : "🤍"}
          <span>{likes.length}</span>
        </button>
      </div>
    </article>
  );
}

export default PostCard;
