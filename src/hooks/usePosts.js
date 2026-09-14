import {
  useCallback,
  useEffect,
  useState,
} from "react";

function usePosts({
  apiUrl,
}) {
  const [posts, setPosts] =
    useState([]);

  const [loadingPosts, setLoadingPosts] =
    useState(true);

  const [creatingPost, setCreatingPost] =
    useState(false);

  const [deletingPostId, setDeletingPostId] =
    useState(null);

  const [likingPostId, setLikingPostId] =
    useState(null);

  const [postError, setPostError] =
    useState("");

  /* =====================================================
     TOKEN
  ===================================================== */

  const getToken = () => {
    return localStorage.getItem(
      "token"
    );
  };

  /* =====================================================
     LOAD POSTS
  ===================================================== */

  const loadPosts =
    useCallback(
      async () => {
        const token =
          getToken();

        if (!token) {
          setLoadingPosts(false);
          return;
        }

        try {
          setPostError("");

          const response =
            await fetch(
              `${apiUrl}/posts`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Could not load posts."
            );
          }

          setPosts(
            data.posts || []
          );
        } catch (error) {
          console.error(
            "Load posts error:",
            error
          );

          setPostError(
            error.message ||
              "Could not load posts."
          );
        } finally {
          setLoadingPosts(false);
        }
      },
      [apiUrl]
    );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /* =====================================================
     CREATE POST
  ===================================================== */

  const createPost =
    async ({
      text = "",
      image = "",
    }) => {
      const token =
        getToken();

      if (!token) {
        setPostError(
          "Please login again."
        );

        return false;
      }

      if (
        !text.trim() &&
        !image
      ) {
        setPostError(
          "Post cannot be empty."
        );

        return false;
      }

      try {
        setCreatingPost(true);
        setPostError("");

        const response =
          await fetch(
            `${apiUrl}/posts`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                text:
                  text.trim(),

                image,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not create post."
          );
        }

        if (data.post) {
          setPosts(
            (previousPosts) => [
              data.post,
              ...previousPosts,
            ]
          );
        }

        return true;
      } catch (error) {
        console.error(
          "Create post error:",
          error
        );

        setPostError(
          error.message ||
            "Could not create post."
        );

        return false;
      } finally {
        setCreatingPost(false);
      }
    };

  /* =====================================================
     DELETE POST
  ===================================================== */

  const deletePost =
    async (postId) => {
      const token =
        getToken();

      if (!token) {
        setPostError(
          "Please login again."
        );

        return false;
      }

      try {
        setDeletingPostId(
          postId
        );

        setPostError("");

        const response =
          await fetch(
            `${apiUrl}/posts/${postId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not delete post."
          );
        }

        setPosts(
          (previousPosts) =>
            previousPosts.filter(
              (post) =>
                String(
                  post._id
                ) !==
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
          error.message ||
            "Could not delete post."
        );

        return false;
      } finally {
        setDeletingPostId(
          null
        );
      }
    };

  /* =====================================================
     LIKE POST
  ===================================================== */

  const likePost =
    async (postId) => {
      const token =
        getToken();

      if (!token) {
        setPostError(
          "Please login again."
        );

        return false;
      }

      try {
        setLikingPostId(
          postId
        );

        const response =
          await fetch(
            `${apiUrl}/posts/${postId}/like`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not like post."
          );
        }

        setPosts(
          (previousPosts) =>
            previousPosts.map(
              (post) => {
                if (
                  String(
                    post._id
                  ) !==
                  String(postId)
                ) {
                  return post;
                }

                return {
                  ...post,

                  likesCount:
                    data.likesCount,
                };
              }
            )
        );

        return true;
      } catch (error) {
        console.error(
          "Like post error:",
          error
        );

        setPostError(
          error.message ||
            "Could not like post."
        );

        return false;
      } finally {
        setLikingPostId(
          null
        );
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