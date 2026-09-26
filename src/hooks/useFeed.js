import { useCallback, useEffect, useState } from "react";

function readCurrentUserId() {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem("user") || "null"
    );

    return String(saved?.id || saved?._id || "");
  } catch {
    return "";
  }
}

function normalizePost(post) {
  const likes = Array.isArray(post.likes)
    ? post.likes
    : [];

  return {
    ...post,
    text: post.text || "",
    image: post.image || "",
    likes,
    likesCount: likes.length,
  };
}

function useFeed({ apiUrl, enabled }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [likingPostId, setLikingPostId] = useState(null);
  const [feedError, setFeedError] = useState("");

  const getToken = () => sessionStorage.getItem("token");

  const loadFeed = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setLoadingPosts(false);
      return;
    }

    try {
      setLoadingPosts(true);
      setFeedError("");

      const response = await fetch(`${apiUrl}/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load feed."
        );
      }

      setPosts((data.posts || []).map(normalizePost));
    } catch (error) {
      console.error("Load feed error:", error);
      setFeedError(
        error.message || "Could not load feed."
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFeed();
  }, [enabled, loadFeed]);

  const createPost = async ({ text = "", image = "" }) => {
    const token = getToken();

    if (!token) {
      setFeedError("Please login again.");
      return false;
    }

    if (!text.trim() && !image) {
      setFeedError("Post needs text or a photo.");
      return false;
    }

    try {
      setCreatingPost(true);
      setFeedError("");

      const response = await fetch(`${apiUrl}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          image,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            "Photo is too large. Try a smaller image."
          );
        }

        throw new Error(
          data.message || "Could not create post."
        );
      }

      if (data.post) {
        setPosts((previous) => [
          normalizePost(data.post),
          ...previous,
        ]);
      }

      return true;
    } catch (error) {
      console.error("Create feed post error:", error);

      const message =
        error.message || "Could not create post.";

      setFeedError(
        message.includes("Failed to fetch")
          ? "Could not upload post. Try a smaller photo."
          : message
      );

      return false;
    } finally {
      setCreatingPost(false);
    }
  };

  const deletePost = async (postId) => {
    const token = getToken();

    if (!token) {
      setFeedError("Please login again.");
      return false;
    }

    try {
      setDeletingPostId(postId);
      setFeedError("");

      const response = await fetch(
        `${apiUrl}/feed/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete post."
        );
      }

      setPosts((previous) =>
        previous.filter(
          (post) => String(post._id) !== String(postId)
        )
      );

      return true;
    } catch (error) {
      console.error("Delete feed post error:", error);
      setFeedError(
        error.message || "Could not delete post."
      );
      return false;
    } finally {
      setDeletingPostId(null);
    }
  };

  const likePost = async (postId) => {
    const token = getToken();

    if (!token) {
      setFeedError("Please login again.");
      return false;
    }

    try {
      setLikingPostId(postId);
      setFeedError("");

      const response = await fetch(
        `${apiUrl}/feed/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not like post."
        );
      }

      const currentUserId = readCurrentUserId();

      setPosts((previous) =>
        previous.map((post) => {
          if (String(post._id) !== String(postId)) {
            return post;
          }

          const likes = Array.isArray(data.likes)
            ? data.likes
            : (() => {
                const nextLikes = Array.isArray(post.likes)
                  ? [...post.likes]
                  : [];
                const index = nextLikes.findIndex(
                  (id) => String(id) === currentUserId
                );

                if (data.liked) {
                  if (index === -1 && currentUserId) {
                    nextLikes.push(currentUserId);
                  }
                } else if (index !== -1) {
                  nextLikes.splice(index, 1);
                }

                return nextLikes;
              })();

          return {
            ...post,
            likes,
            likesCount:
              typeof data.likesCount === "number"
                ? data.likesCount
                : likes.length,
          };
        })
      );

      return true;
    } catch (error) {
      console.error("Like feed post error:", error);
      setFeedError(
        error.message || "Could not like post."
      );
      return false;
    } finally {
      setLikingPostId(null);
    }
  };

  return {
    posts,
    loadingPosts,
    creatingPost,
    deletingPostId,
    likingPostId,
    feedError,
    setFeedError,
    loadFeed,
    createPost,
    deletePost,
    likePost,
  };
}

export default useFeed;
