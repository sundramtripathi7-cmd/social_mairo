import { useRef, useState } from "react";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
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

        const outputType = "image/jpeg";

        resolve(
          canvas.toDataURL(outputType, JPEG_QUALITY)
        );
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function CreateFeedPost({
  currentUser,
  onCreatePost,
  creating,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const busy = creating || compressing;
  const initial =
    currentUser?.username?.charAt(0).toUpperCase() ||
    "U";

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    setImageError("");

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      !/\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(
        file.name || ""
      )
    ) {
      setImageError("Only photos can be posted.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageError("Photo must be smaller than 20 MB.");
      event.target.value = "";
      return;
    }

    try {
      setCompressing(true);
      const dataUrl = await compressImageFile(file);
      setImage(dataUrl);
    } catch (error) {
      console.error("Image compress error:", error);
      setImageError(
        error.message || "Could not process photo."
      );
      setImage("");
      event.target.value = "";
    } finally {
      setCompressing(false);
    }
  }

  function removeImage() {
    setImage("");
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            <label
              className={`photo-pick ${
                busy ? "is-disabled" : ""
              }`}
            >
              {compressing ? "Loading photo..." : "Photo"}
              <input
                ref={fileInputRef}
                className="photo-pick-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={busy}
              />
            </label>
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
