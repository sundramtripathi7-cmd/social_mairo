function ProfileModal({
  showProfile,
  closeProfile,
  profileName,
  setProfileName,
  profileUsername,
  setProfileUsername,
  profilePhoto,
  handleProfilePhoto,
  profileSaving,
  profileError,
  saveProfile,
}) {
  if (!showProfile) {
    return null;
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
            disabled={profileSaving}
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
          disabled={profileSaving}
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
          disabled={profileSaving}
          maxLength={30}
        />

        <p className="jsx-style-28">
          Only letters, numbers, underscore and dot.
        </p>

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
            disabled={profileSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveProfile}
            disabled={profileSaving}
            className="primary-btn jsx-style-32"
          >
            {profileSaving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;