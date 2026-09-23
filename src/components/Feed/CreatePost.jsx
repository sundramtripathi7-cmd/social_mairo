import { useRef, useState } from "react";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1280;
const JPEG_QUALITY = 0.78;

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Could not read image file."));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error("Could not load image."));
      };

      img.onload = () => {
        const scale = Math.min(
          1,
          MAX_IMAGE_WIDTH / img.width
        );

        const width = Math.max(
          1,
          Math.round(img.width * scale)
        );

        const height = Math.max(
          1,
          Math.round(img.height * scale)
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process image."));
          return;
        }

        context.drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png"
          ? "image/png"
          : "image/jpeg";

        const dataUrl = canvas.toDataURL(
          outputType,
          JPEG_QUALITY
        );

        resolve(dataUrl);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function CreatePost({
  currentUser,
  onCreatePost,
  creating,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageError, setImageError] = useState("");
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    setImageError("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setCompressing(true);

      const dataUrl = await compressImageFile(file);

      setImage(dataUrl);
      setImageName(file.name);
    } catch (error) {
      console.error("Image compress error:", error);
      setImageError(
        error.message || "Could not process image."
      );
      setImage("");
      setImageName("");
      event.target.value = "";
    } finally {
      setCompressing(false);
    }
  }

  function removeImage() {
    setImage("");
    setImageName("");
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim() && !image) {
      return;
    }

    const success = await onCreatePost({
      text,
      image,
    });

    if (success) {
      setText("");
      setImage("");
      setImageName("");
      setImageError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const userInitial =
    currentUser?.username?.charAt(0).toUpperCase() ||
    "U";

  const busy = creating || compressing;

  return (
    <section className="create-post-card">
      <div className="create-post-top">
        <div className="create-post-avatar">
          {currentUser?.photo ? (
            <img
              src={currentUser.photo}
              alt={`@${currentUser.username}`}
            />
          ) : (
            userInitial
          )}
        </div>

        <div className="create-post-user">
          <strong>
            @{currentUser?.username || "user"}
          </strong>
          <span>Share something new</span>
        </div>
      </div>

      <form
        className="create-post-form"
        onSubmit={handleSubmit}
      >
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
              title="Remove image"
              aria-label="Remove image"
              disabled={busy}
            >
              ×
            </button>
          </div>
        )}

        {imageName && (
          <div className="selected-image-name">
            📷 {imageName}
          </div>
        )}

        {imageError && (
          <div className="create-post-image-error">
            {imageError}
          </div>
        )}

        <div className="create-post-expiry-note">
          Auto-deletes in 7 days · you can also delete
          manually anytime
        </div>

        <div className="create-post-footer">
          <div className="create-post-options">
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={busy}
              title="Add photo"
            >
              🖼️
              <span>
                {compressing ? "Loading..." : "Photo"}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </div>

          <button
            type="submit"
            className="create-post-btn"
            disabled={
              busy || (!text.trim() && !image)
            }
          >
            {creating ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreatePost;
