function formatFeedTime(value) {
  if (!value) {
    return "";
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(value).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function FeedCard({
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
  const authorId = String(author._id || author.id || "");
  const isOwn =
    Boolean(currentUserId) && currentUserId === authorId;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const likesCount =
    typeof post.likesCount === "number"
      ? post.likesCount
      : likes.length;
  const isLiked = likes.some(
    (userId) => String(userId) === currentUserId
  );

  async function handleDelete() {
    const confirmed = window.confirm("Delete this post?");

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
              <img src={author.photo} alt="" />
            ) : (
              author.username?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          <div className="post-author-info">
            <strong>@{author.username || "user"}</strong>
            <span>{formatFeedTime(post.createdAt)}</span>
          </div>
        </div>

        {isOwn && (
          <button
            type="button"
            className="post-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete post"
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
            alt=""
            className="post-image"
          />
        </div>
      )}

      <div className="post-actions">
        <button
          type="button"
          className={`post-action-btn ${
            isLiked ? "liked" : ""
          }`}
          onClick={() => onLike(post._id)}
          disabled={liking}
          aria-label={isLiked ? "Unlike post" : "Like post"}
        >
          {isLiked ? "❤️" : "🤍"}
          <span>{likesCount}</span>
        </button>
      </div>
    </article>
  );
}

export default FeedCard;
