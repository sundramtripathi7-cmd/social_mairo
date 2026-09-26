import { useRef } from "react";
import { createPortal } from "react-dom";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1280;

export function compressPhotoFile(file, maxWidth = MAX_IMAGE_WIDTH) {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("video/")) {
      reject(new Error("Only photos can be uploaded."));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Photo must be smaller than 25 MB."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;

        if (!sourceWidth || !sourceHeight) {
          reject(new Error("Could not read this photo."));
          return;
        }

        const scale = Math.min(1, maxWidth / sourceWidth);
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not process this photo."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);

        if (!dataUrl.startsWith("data:image/")) {
          reject(
            new Error("Could not read this photo. Try another one.")
          );
          return;
        }

        resolve(dataUrl);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Could not process this photo.")
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error("Could not open this photo. Choose a JPG or PNG.")
      );
    };

    image.src = objectUrl;
  });
}

function PhonePhotoButton({
  className,
  disabled,
  children,
  onFile,
}) {
  const inputRef = useRef(null);

  function openPicker() {
    const input = inputRef.current;

    if (!input || disabled) {
      return;
    }

    input.value = "";
    input.click();
  }

  function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    onFile(file);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={openPicker}
      >
        {children}
      </button>

      {createPortal(
        <input
          ref={inputRef}
          className="phone-file-input"
          type="file"
          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
          onChange={handleChange}
        />,
        document.body
      )}
    </>
  );
}

export default PhonePhotoButton;
