import { useState } from "react";
import InterestPicker from "./InterestPicker";

function ProfileModal({
  showProfile,
  closeProfile,
  profileName,
  setProfileName,
  profileUsername,
  setProfileUsername,
  profilePhoto,
  profileInterests,
  setProfileInterests,
  handleProfilePhoto,
  profileSaving,
  deletingAccount,
  profileError,
  saveProfile,
  deleteAccount,
}) {
  const [confirmingDelete, setConfirmingDelete] =
    useState(false);
  const [deletePassword, setDeletePassword] =
    useState("");

  const busy = profileSaving || deletingAccount;
  if (!showProfile) {
    return null;
  }

  async function handleDeleteAccount() {
    const deleted = await deleteAccount(
      deletePassword
    );

    if (deleted) {
      setDeletePassword("");
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="jsx-style-13" onClick={closeProfile}>
      <div
        className="jsx-style-14"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="jsx-style-15">
          <h2 className="jsx-style-16">My Profile</h2>

          <button
            className="jsx-style-17"
            type="button"
            onClick={closeProfile}
            disabled={busy}
          >
            ×
          </button>
        </div>

        <div className="jsx-style-18">
          <label
            className="jsx-style-19"
            title="Change profile photo"
          >
            {profilePhoto ? (
              <img
                className="jsx-style-20"
                src={profilePhoto}
                alt="Profile"
              />
            ) : (
              <span className="jsx-style-21">
                {profileName
                  ? profileName.charAt(0).toUpperCase()
                  : "U"}
              </span>
            )}

            <input
              className="jsx-style-22"
              type="file"
              accept="image/*"
              onChange={handleProfilePhoto}
            />
          </label>

          <p className="jsx-style-23">
            Click photo to change
          </p>
        </div>

        <label className="jsx-style-24">
          Full Name
        </label>

        <input
          className="jsx-style-25"
          type="text"
          value={profileName}
          onChange={(event) =>
            setProfileName(event.target.value)
          }
          disabled={busy}
          maxLength={50}
        />

        <label className="jsx-style-26">
          Username
        </label>

        <input
          className="jsx-style-27"
          type="text"
          value={profileUsername}
          onChange={(event) =>
            setProfileUsername(event.target.value)
          }
          disabled={busy}
          maxLength={30}
        />

        <p className="jsx-style-28">
          Only letters, numbers, underscore and dot.
        </p>

        <label className="jsx-style-26">
          Interests
        </label>

        <p className="jsx-style-28 interest-help">
          People who share more of these appear
          higher in your chat list.
        </p>

        <InterestPicker
          selected={profileInterests || []}
          onChange={setProfileInterests}
          disabled={busy}
        />

        {profileError && (
          <p className="jsx-style-29">
            {profileError}
          </p>
        )}

        <div className="jsx-style-30">
          <button
            className="jsx-style-31"
            type="button"
            onClick={closeProfile}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveProfile}
            disabled={busy}
            className="primary-btn jsx-style-32"
          >
            {profileSaving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

        <div className="account-delete">
          <p>
            Delete your ID permanently. Chats,
            status, and feed posts are removed
            and cannot be restored.
          </p>

          {confirmingDelete ? (
            <div className="account-delete-panel">
              <input
                type="password"
                value={deletePassword}
                onChange={(event) =>
                  setDeletePassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={busy}
                aria-label="Password to delete account"
              />

              <div className="account-delete-actions">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    setDeletePassword("");
                  }}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="account-delete-confirm"
                  onClick={handleDeleteAccount}
                  disabled={
                    busy || !deletePassword
                  }
                >
                  {deletingAccount
                    ? "Deleting..."
                    : "Delete forever"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="account-delete-btn"
              onClick={() =>
                setConfirmingDelete(true)
              }
              disabled={busy}
            >
              Delete account permanently
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;