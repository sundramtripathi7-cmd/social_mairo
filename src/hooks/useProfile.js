import { useState } from "react";

function useProfile({
  currentUser,
  setCurrentUser,
  apiUrl,
}) {
  const [showProfile, setShowProfile] =
    useState(false);

  const [profileName, setProfileName] =
    useState(currentUser?.name || "");

  const [profileUsername, setProfileUsername] =
    useState(currentUser?.username || "");

  const [profilePhoto, setProfilePhoto] =
    useState(currentUser?.photo || "");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  function openProfile() {
    setProfileName(
      currentUser?.name || ""
    );

    setProfileUsername(
      currentUser?.username || ""
    );

    setProfilePhoto(
      currentUser?.photo || ""
    );

    setProfileError("");
    setShowProfile(true);
  }

  function closeProfile() {
    if (profileSaving) {
      return;
    }

    setShowProfile(false);
    setProfileError("");
  }

  async function handleProfilePhoto(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setProfileError(
        "Photo must be smaller than 8 MB."
      );
      return;
    }

    try {
      const compressedPhoto =
        await new Promise(
          (resolve, reject) => {
            const reader =
              new FileReader();

            reader.onload = () => {
              const image =
                new Image();

              image.onload = () => {
                const maxSize = 500;

                let width =
                  image.width;

                let height =
                  image.height;

                if (
                  width > height &&
                  width > maxSize
                ) {
                  height = Math.round(
                    (height * maxSize) /
                      width
                  );

                  width = maxSize;
                } else if (
                  height >= width &&
                  height > maxSize
                ) {
                  width = Math.round(
                    (width * maxSize) /
                      height
                  );

                  height = maxSize;
                }

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                canvas.width = width;
                canvas.height = height;

                const context =
                  canvas.getContext(
                    "2d"
                  );

                if (!context) {
                  reject(
                    new Error(
                      "Could not process image."
                    )
                  );

                  return;
                }

                context.drawImage(
                  image,
                  0,
                  0,
                  width,
                  height
                );

                resolve(
                  canvas.toDataURL(
                    "image/jpeg",
                    0.8
                  )
                );
              };

              image.onerror = () =>
                reject(
                  new Error(
                    "Could not read image."
                  )
                );

              image.src =
                reader.result;
            };

            reader.onerror = () =>
              reject(
                new Error(
                  "Could not read file."
                )
              );

            reader.readAsDataURL(file);
          }
        );

      setProfilePhoto(
        compressedPhoto
      );

      setProfileError("");
    } catch (error) {
      console.error(error);

      setProfileError(
        "Could not load this photo."
      );
    }

    event.target.value = "";
  }

  async function saveProfile() {
    const token =
      sessionStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    const cleanName =
      profileName.trim();

    const cleanUsername =
      profileUsername
        .trim()
        .toLowerCase();

    if (!cleanName) {
      setProfileError(
        "Name cannot be empty."
      );
      return;
    }

    if (!cleanUsername) {
      setProfileError(
        "Username cannot be empty."
      );
      return;
    }

    if (
      !/^[a-zA-Z0-9_.]+$/.test(
        cleanUsername
      )
    ) {
      setProfileError(
        "Username can contain only letters, numbers, underscore and dot."
      );
      return;
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      setProfileError(
        "Username must be between 3 and 30 characters."
      );
      return;
    }

    setProfileSaving(true);
    setProfileError("");

    try {
      const response =
        await fetch(
          `${apiUrl}/auth/profile`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: cleanName,
              username:
                cleanUsername,
              photo:
                profilePhoto || "",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update profile."
        );
      }

      const updatedUser =
        data.user;

      setCurrentUser(
        updatedUser
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify(
          updatedUser
        )
      );

      setProfileName(
        updatedUser.name || ""
      );

      setProfileUsername(
        updatedUser.username ||
          ""
      );

      setProfilePhoto(
        updatedUser.photo || ""
      );

      setShowProfile(false);
    } catch (error) {
      console.error(error);

      setProfileError(
        error.message ||
          "Could not update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  return {
    showProfile,
    profileName,
    profileUsername,
    profilePhoto,
    profileSaving,
    profileError,

    setProfileName,
    setProfileUsername,
    setProfilePhoto,

    openProfile,
    closeProfile,
    handleProfilePhoto,
    saveProfile,
  };
}

export default useProfile;