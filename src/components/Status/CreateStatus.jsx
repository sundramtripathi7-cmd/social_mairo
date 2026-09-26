import { useEffect, useRef, useState } from "react";

import {
  STATUS_BACKGROUNDS,
  statusFontSize,
} from "./statusUtils";

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

        const outputType =
          file.type === "image/png"
            ? "image/png"
            : "image/jpeg";

        resolve(
          canvas.toDataURL(outputType, JPEG_QUALITY)
        );
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

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

  const fileInputRef = useRef(null);
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
    } catch (error) {
      console.error("Image compress error:", error);
      setImageError(
        error.message || "Could not process image."
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
          <button
            type="button"
            className="status-tool-btn"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={busy}
          >
            {compressing ? "Loading photo..." : "Photo"}
          </button>

          <span>Disappears after 24 hours</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          hidden
        />
      </div>
    </form>
  );
}

export default CreateStatus;
