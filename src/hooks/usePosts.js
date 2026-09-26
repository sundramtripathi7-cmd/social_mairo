import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getStoredUser, getToken } from "../utils/authStorage";

function readCurrentUserId() {
  try {
    const saved = getStoredUser();

    return String(saved?.id || saved?._id || "");
  } catch {
    return "";
  }
}

function normalizePost(post) {
  const currentUserId = readCurrentUserId();
  const author = post.author || {};
  const authorId = String(
    author._id || author.id || ""
  );
  const isOwn =
    Boolean(currentUserId) &&
    authorId === currentUserId;

  const likes = Array.isArray(post.likes)
    ? post.likes
    : [];

  const viewers = Array.isArray(post.viewers)
    ? post.viewers
    : [];

  return {
    ...post,
    text: post.text || "",
    image: post.image || "",
    background: post.background || "",
    likes,
    likesCount: likes.length,
    viewers: isOwn ? viewers : [],
    viewersCount: isOwn
      ? typeof post.viewersCount === "number"
        ? post.viewersCount
        : viewers.length
      : 0,
    viewedByMe: isOwn
      ? true
      : Boolean(post.viewedByMe),
  };
}

function usePosts({ apiUrl }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [likingPostId, setLikingPostId] = useState(null);
  const [postError, setPostError] = useState("");
  const viewedRef = useRef(new Set());

  /*
    LOAD STATUSES
  */
  const loadPosts = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setLoadingPosts(false);
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load statuses."
        );
      }

      const now = Date.now();

      const activePosts = (data.posts || []).filter(
        (post) => {
          if (!post.expiresAt) {
            return true;
          }

          return (
            new Date(post.expiresAt).getTime() > now
          );
        }
      );

      const normalizedPosts =
        activePosts.map(normalizePost);

      normalizedPosts.forEach((post) => {
        if (post.viewedByMe) {
          viewedRef.current.add(String(post._id));
        }
      });

      setPosts(normalizedPosts);
    } catch (error) {
      console.error("Load statuses error:", error);

      setPostError(
        error.message || "Could not load statuses."
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [apiUrl]);

  /*
    LOAD STATUSES WHEN HOOK STARTS
  */
  useEffect(() => {
    // Same mount-fetch pattern as the other chat hooks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPosts();
  }, [loadPosts]);

  /*
    CREATE STATUS
  */
  const createPost = async ({
    text = "",
    image = "",
    background = "",
  }) => {
    const token = getToken();

    if (!token) {
      setPostError("Please login again.");
      return false;
    }

    if (!text.trim() && !image) {
      setPostError("Status cannot be empty.");
      return false;
    }

    try {
      setCreatingPost(true);
      setPostError("");

      const response = await fetch(
        `${apiUrl}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: text.trim(),
            image,
            background,
          }),
        }
      );

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
          data.message || "Could not post status."
        );
      }

      if (data.post) {
        setPosts((previousPosts) => [
          normalizePost(data.post),
          ...previousPosts,
        ]);
      }

      return true;
    } catch (error) {
      console.error(
        "Create status error:",
        error
      );

      const message =
        error.message || "Could not post status.";

      setPostError(
        message.includes("Failed to fetch")
          ? "Could not upload status. Try a smaller photo."
          : message
      );

      return false;
    } finally {
      setCreatingPost(false);
    }
  };

  /*
    DELETE STATUS
  */
  const deletePost = async (postId) => {
    const token = getToken();

    if (!token) {
      setPostError("Please login again.");
      return false;
    }

    try {
      setDeletingPostId(postId);
      setPostError("");

      const response = await fetch(
        `${apiUrl}/posts/${postId}`,
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
          data.message || "Could not delete status."
        );
      }

      setPosts((previousPosts) =>
        previousPosts.filter(
          (post) =>
            String(post._id) !==
            String(postId)
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Delete status error:",
        error
      );

      setPostError(
        error.message || "Could not delete status."
      );

      return false;
    } finally {
      setDeletingPostId(null);
    }
  };

  /*
    LIKE / UNLIKE STATUS
  */
  const likePost = async (postId) => {
    const token = getToken();

    if (!token) {
      setPostError("Please login again.");
      return false;
    }

    try {
      setLikingPostId(postId);
      setPostError("");

      const response = await fetch(
        `${apiUrl}/posts/${postId}/like`,
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
          data.message || "Could not like status."
        );
      }

      const currentUserId = readCurrentUserId();

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (String(post._id) !== String(postId)) {
            return post;
          }

          if (Array.isArray(data.likes)) {
            return {
              ...post,
              likes: data.likes,
              likesCount:
                typeof data.likesCount === "number"
                  ? data.likesCount
                  : data.likes.length,
            };
          }

          let likes = Array.isArray(post.likes)
            ? [...post.likes]
            : [];

          const existingIndex = likes.findIndex(
            (id) => String(id) === currentUserId
          );

          if (data.liked) {
            if (existingIndex === -1 && currentUserId) {
              likes.push(currentUserId);
            }
          } else if (existingIndex !== -1) {
            likes.splice(existingIndex, 1);
          }

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
      console.error("Like status error:", error);

      setPostError(
        error.message || "Could not like status."
      );

      return false;
    } finally {
      setLikingPostId(null);
    }
  };

  /*
    MARK A STATUS AS VIEWED
  */
  const viewStatus = useCallback(async (postId) => {
    const token = getToken();
    const id = String(postId || "");

    if (!token || !id) {
      return false;
    }

    if (viewedRef.current.has(id)) {
      return true;
    }

    viewedRef.current.add(id);

    setPosts((previousPosts) =>
      previousPosts.map((post) => {
        if (String(post._id) !== id) {
          return post;
        }

        return {
          ...post,
          viewedByMe: true,
        };
      })
    );

    try {
      const response = await fetch(
        `${apiUrl}/posts/${id}/view`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark status viewed.");
      }

      return true;
    } catch (error) {
      console.error("View status error:", error);

      viewedRef.current.delete(id);

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (String(post._id) !== id) {
            return post;
          }

          return {
            ...post,
            viewedByMe: false,
          };
        })
      );

      return false;
    }
  }, [apiUrl]);

  return {
    posts,
    setPosts,
    loadingPosts,
    creatingPost,
    deletingPostId,
    likingPostId,
    postError,
    setPostError,
    loadPosts,
    createPost,
    deletePost,
    likePost,
    viewStatus,
  };
}

export default usePosts;
