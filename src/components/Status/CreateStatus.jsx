import { useEffect, useRef, useState } from "react";
import PhonePhotoButton, {
  compressPhotoFile,
} from "../PhonePhotoButton";

import {
  STATUS_BACKGROUNDS,
  statusFontSize,
} from "./statusUtils";

function CreateStatus({
  onClose,
  onCreatePost,
  creating,
  postError,
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [background, setBackground] = useState(
    STATUS_BACKGROUNDS[0]
  );
  const [imageError, setImageError] = useState("");
  const [compressing, setCompressing] = useState(false);

  const textRef = useRef(null);

  const busy = creating || compressing;

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  async function handlePhotoFile(file) {
    setImageError("");

    try {
      setCompressing(true);
      const dataUrl = await compressPhotoFile(file);
      setImage(dataUrl);
    } catch (error) {
      console.error("Image compress error:", error);
      setImageError(
        error.message || "Could not process image."
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

    const success = await onCreatePost({
      text,
      image,
      background: image ? "" : background,
    });

    if (success) {
      onClose();
    }
  }

  return (
    <form
      className="status-composer"
      style={{
        background: image ? "#000000" : background,
      }}
      onSubmit={handleSubmit}
    >
      <div className="status-composer-top">
        <button
          type="button"
          className="status-icon-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <button
          type="submit"
          className="status-send-btn"
          disabled={busy || (!text.trim() && !image)}
        >
          {creating ? "Posting..." : "Send"}
        </button>
      </div>

      {image ? (
        <div className="status-composer-photo">
          <img src={image} alt="Status preview" />

          <button
            type="button"
            className="status-icon-btn status-remove-photo"
            onClick={removeImage}
            disabled={busy}
            aria-label="Remove photo"
          >
            ×
          </button>
        </div>
      ) : (
        <textarea
          ref={textRef}
          className="status-composer-text"
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Type a status"
          maxLength={700}
          disabled={busy}
          aria-label="Status text"
          style={{
            fontSize: statusFontSize(text || "Type"),
          }}
        />
      )}

      <div className="status-composer-bottom">
        {(imageError || postError) && (
          <div className="status-composer-error" role="alert">
            {imageError || postError}
          </div>
        )}

        {image ? (
          <input
            className="status-caption-input"
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            placeholder="Add a caption"
            maxLength={200}
            disabled={busy}
            aria-label="Caption"
          />
        ) : (
          <div
            className="status-color-row"
            role="listbox"
            aria-label="Background color"
          >
            {STATUS_BACKGROUNDS.map((color) => (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={background === color}
                aria-label={`Background ${color}`}
                className={`status-color-swatch ${
                  background === color ? "active" : ""
                }`}
                style={{ background: color }}
                onClick={() => setBackground(color)}
                disabled={busy}
              />
            ))}
          </div>
        )}

        <div className="status-composer-tools">
          <PhonePhotoButton
            className="status-tool-btn"
            disabled={busy}
            onFile={handlePhotoFile}
          >
            {compressing ? "Loading photo..." : "Photo"}
          </PhonePhotoButton>

          <span>Disappears after 24 hours</span>
        </div>
      </div>
    </form>
  );
}

export default CreateStatus;
