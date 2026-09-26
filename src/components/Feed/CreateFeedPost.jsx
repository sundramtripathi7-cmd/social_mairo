import { useState } from "react";
import PhonePhotoButton, {
  compressPhotoFile,
} from "../PhonePhotoButton";

function CreateFeedPost({
  currentUser,
  onCreatePost,
  creating,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [compressing, setCompressing] = useState(false);

  const busy = creating || compressing;
  const initial =
    currentUser?.username?.charAt(0).toUpperCase() ||
    "U";

  async function handlePhotoFile(file) {
    setImageError("");

    try {
      setCompressing(true);
      const dataUrl = await compressPhotoFile(file);
      setImage(dataUrl);
    } catch (error) {
      console.error("Image compress error:", error);
      setImageError(
        error.message || "Could not process photo."
      );
      setImage("");
    } finally {
      setCompressing(false);
    }
  }

  function removeImage() {
    setImage("");
    setImageError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy || (!text.trim() && !image)) {
      return;
    }

    const success = await onCreatePost({ text, image });

    if (success) {
      setText("");
      removeImage();
    }
  }

  return (
    <section className="create-post-card">
      <form className="create-post-form" onSubmit={handleSubmit}>
        <div className="create-post-top">
          <div className="create-post-avatar">
            {currentUser?.photo ? (
              <img
                src={currentUser.photo}
                alt=""
              />
            ) : (
              initial
            )}
          </div>

          <div className="create-post-user">
            <strong>
              @{currentUser?.username || "user"}
            </strong>
            <span>Photo or text</span>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder={`What's on your mind, @${
            currentUser?.username || "user"
          }?`}
          maxLength={2000}
          disabled={busy}
          aria-label="Post text"
        />

        {image && (
          <div className="post-image-preview">
            <img src={image} alt="Preview" />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove photo"
              disabled={busy}
            >
              ×
            </button>
          </div>
        )}

        {imageError && (
          <div className="create-post-image-error">
            {imageError}
          </div>
        )}

        <div className="create-post-footer">
          <div className="create-post-options">
            <PhonePhotoButton
              className="photo-pick"
              disabled={busy}
              onFile={handlePhotoFile}
            >
              {compressing ? "Loading photo..." : "Photo"}
            </PhonePhotoButton>
          </div>

          <button
            type="submit"
            className="create-post-btn"
            disabled={busy || (!text.trim() && !image)}
          >
            {creating ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateFeedPost;
