import { useRef, useState } from "react";

function CreatePost({
  currentUser,
  onCreatePost,
  creating,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [imageName, setImageName] =
    useState("");

  const fileInputRef = useRef(null);

  function handleImageChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    /*
      Keep image size reasonable because
      we are storing it as base64 for now.
    */
    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image must be smaller than 5 MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setImageName(file.name);
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage("");
    setImageName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim() && !image) {
      return;
    }

    const success =
      await onCreatePost({
        text,
        image,
      });

    if (success) {
      setText("");
      setImage("");
      setImageName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const userInitial =
    currentUser?.username
      ?.charAt(0)
      .toUpperCase() || "U";

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

          <span>What's on your mind?</span>
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
          disabled={creating}
        />

        {image && (
          <div className="post-image-preview">
            <img
              src={image}
              alt="Preview"
            />

            <button
              type="button"
              onClick={removeImage}
              title="Remove image"
              disabled={creating}
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

        <div className="create-post-footer">
          <div className="create-post-options">
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={creating}
              title="Add photo"
            >
              🖼️
              <span>Photo</span>
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
              creating ||
              (!text.trim() && !image)
            }
          >
            {creating
              ? "Posting..."
              : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreatePost;