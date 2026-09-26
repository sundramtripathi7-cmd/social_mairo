import { useState } from "react";
import {
  getToken,
  saveSession,
} from "../utils/authStorage";
import { compressPhotoFile } from "../components/PhonePhotoButton";

function useProfile({
  currentUser,
  setCurrentUser,
  apiUrl,
}) {
  const [showProfile, setShowProfile] =
    useState(false);

  const [profileName, setProfileName] =
    useState(
      currentUser?.name ||
        currentUser?.username ||
        ""
    );

  const [profileUsername, setProfileUsername] =
    useState(currentUser?.username || "");

  const [profilePhoto, setProfilePhoto] =
    useState(currentUser?.photo || "");

  const [profileInterests, setProfileInterests] =
    useState(currentUser?.interests || []);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  function openProfile() {
    setProfileName(
      currentUser?.name ||
        currentUser?.username ||
        ""
    );

    setProfileUsername(
      currentUser?.username || ""
    );

    setProfilePhoto(
      currentUser?.photo || ""
    );

    setProfileInterests(
      currentUser?.interests || []
    );

    setProfileError("");
    setShowProfile(true);
  }

  function closeProfile() {
    if (profileSaving || deletingAccount) {
      return;
    }

    setShowProfile(false);
    setProfileError("");
  }

  async function handleProfilePhoto(file) {
    if (!file) {
      return;
    }

    try {
      const compressedPhoto = await compressPhotoFile(
        file,
        500
      );

      setProfilePhoto(compressedPhoto);
      setProfileError("");
    } catch (error) {
      console.error(error);

      setProfileError(
        error.message || "Could not load this photo."
      );
    }
  }

  async function saveProfile() {
    const token = getToken();

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
              interests: profileInterests,
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

      saveSession(getToken(), updatedUser);

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

      setProfileInterests(
        updatedUser.interests || []
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

  async function deleteAccount(password) {
    const token = getToken();

    if (!token) {
      setProfileError("Please login again.");
      return false;
    }

    if (!password) {
      setProfileError(
        "Enter your password to delete your account."
      );
      return false;
    }

    try {
      setDeletingAccount(true);
      setProfileError("");

      const response = await fetch(
        `${apiUrl}/auth/account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not delete account."
        );
      }

      return true;
    } catch (error) {
      console.error(error);

      setProfileError(
        error.message ||
          "Could not delete account."
      );

      return false;
    } finally {
      setDeletingAccount(false);
    }
  }

  return {
    showProfile,
    profileName,
    profileUsername,
    profilePhoto,
    profileInterests,
    profileSaving,
    deletingAccount,
    profileError,

    setProfileName,
    setProfileUsername,
    setProfilePhoto,
    setProfileInterests,

    openProfile,
    closeProfile,
    handleProfilePhoto,
    saveProfile,
    deleteAccount,
  };
}

export default useProfile;