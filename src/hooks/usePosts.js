import { useCallback, useEffect, useState } from "react";

function usePosts({ apiUrl }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [likingPostId, setLikingPostId] = useState(null);
  const [postError, setPostError] = useState("");

  const getToken = () => {
    return sessionStorage.getItem("token");
  };

  /*
    LOAD POSTS
  */
  const loadPosts = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setLoadingPosts(false);
      return;
    }

    try {
      setLoadingPosts(true);
      setPostError("");

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
          data.message || "Could not load posts."
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

      .setPosts(activePosts.map((post) => ({
        ...post,
        likes: Array.isArray(post.likes)
          ? post.likes
          : [],
        likesCount: Array.isArray(post.likes)
          ? post.likes.length
          : 0,
      })));
    } catch (error) {
      console.error("Load posts error:", error);

      setPostError(
        error.message || "Could not load posts."
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [apiUrl]);

  /*
    LOAD POSTS WHEN HOOK STARTS
  */
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /*
    CREATE POST
  */
  const createPost = async ({
    text = "",
    image = "",
  }) => {
    const token = getToken();

    if (!token) {
      setPostError("Please login again.");
      return false;
    }

    if (!text.trim() && !image) {
      setPostError("Post cannot be empty.");
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
          data.message || "Could not create post."
        );
      }

      if (data.post) {
        setPosts((previousPosts) => [
          {
            ...data.post,
            likes: Array.isArray(data.post.likes)
              ? data.post.likes
              : [],
            likesCount: Array.isArray(data.post.likes)
              ? data.post.likes.length
              : 0,
          },
          ...previousPosts,
        ]);
      }

      return true;
    } catch (error) {
      console.error(
        "Create post error:",
        error
      );

      const message =
        error.message || "Could not create post.";

      setPostError(
        message.includes("Failed to fetch")
          ? "Could not upload post. Try a smaller photo."
          : message
      );

      return false;
    } finally {
      setCreatingPost(false);
    }
  };

  /*
    DELETE POST
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
          data.message || "Could not delete post."
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
        "Delete post error:",
        error
      );

      setPostError(
        error.message || "Could not delete post."
      );

      return false;
    } finally {
      setDeletingPostId(null);
    }
  };

  /*
    LIKE / UNLIKE POST
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
          data.message || "Could not like post."
        );
      }

      const savedUser = JSON.parse(
        sessionStorage.getItem("user") || "null"
      );

      const currentUserId = String(
        savedUser?.id || savedUser?._id || ""
      );

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
      console.error("Like post error:", error);

      setPostError(
        error.message || "Could not like post."
      );

      return false;
    } finally {
      setLikingPostId(null);
    }
  };

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
  };
}

export default usePosts;