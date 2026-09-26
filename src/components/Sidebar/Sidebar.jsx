import { useEffect, useRef, useState } from "react";
import { everyoneGroup } from "../../constants/group";

const FILTERS = [
  { id: "all", label: "All", short: "All" },
  { id: "male", label: "Male", short: "M" },
  { id: "female", label: "Female", short: "F" },
];

function GenderCorner({
  genderFilter,
  setGenderFilter,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current =
    FILTERS.find((item) => item.id === genderFilter) ||
    FILTERS[0];

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  return (
    <div className="gender-corner" ref={rootRef}>
      <button
        type="button"
        className={`gender-corner-btn ${
          genderFilter === "all" ? "" : "active"
        }`}
        aria-expanded={open}
        aria-label={`People filter: ${current.label}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        {current.short}
      </button>

      {open && (
        <div className="gender-corner-menu" role="menu">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={
                genderFilter === item.id ? "active" : ""
              }
              onClick={() => {
                setGenderFilter(item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  filteredUsers,
  selectedUserId,
  unreadCounts,
  search,
  setSearch,
  genderFilter,
  setGenderFilter,
  selectUser,
  currentUser,
  openProfile,
  logout,
  error,
}) {
  const profileInitial = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase()
    : currentUser?.name
      ? currentUser.name.charAt(0).toUpperCase()
      : "U";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h2>mairochat</h2>

        <div className="sidebar-actions">
          <GenderCorner
            genderFilter={genderFilter}
            setGenderFilter={setGenderFilter}
          />

          <button className="new-chat-btn" type="button">
            + New
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <span>🔍</span>

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {currentUser?.interests?.length > 0 && (
        <p className="match-hint">
          Sorted by interest match
        </p>
      )}

      {/* ERROR */}
      {error && (
        <p className="jsx-style-2">
          {error}
        </p>
      )}

      {/* USERS */}
      <div className="chat-list">
        {(!search.trim() ||
          "everyone".includes(search.trim().toLowerCase()) ||
          "all users".includes(search.trim().toLowerCase())) && (
          <div
            className={`chat-user group-user ${
              selectedUserId === everyoneGroup.id ? "active" : ""
            }`}
            onClick={() => selectUser(everyoneGroup)}
          >
            <div className="avatar group-avatar">E</div>

            <div className="chat-info">
              <div className="chat-name">
                <strong>Everyone</strong>
              </div>

              <div className="chat-status-row">
                <span className="group-tag">
                  All users
                </span>

                {(unreadCounts[everyoneGroup.id] || 0) > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[everyoneGroup.id] > 99
                      ? "99+"
                      : unreadCounts[everyoneGroup.id]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const userId = String(
              user.id || user._id
            );

            const unread =
              unreadCounts[userId] || 0;

            return (
              <div
                key={userId}
                className={`chat-user ${
                  selectedUserId === userId
                    ? "active"
                    : ""
                }`}
                onClick={() => selectUser(user)}
              >
                {/* Avatar */}
                <div className="avatar">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={`@${user.username}`}
                      className="chat-user-photo"
                    />
                  ) : (
                    user.initial ||
                    user.username
                      ?.charAt(0)
                      .toUpperCase()
                  )}

                  {user.online && (
                    <span className="online-dot"></span>
                  )}
                </div>

                {/* User Info */}
                <div className="chat-info">
                  <div className="chat-name">
                    <strong>
                      @{user.username}
                    </strong>

                    <span>{user.time}</span>
                  </div>

                  {/* Online / Offline Status */}
                  <div className="chat-status-row">
                    <span
                      className={`status-dot ${
                        user.online
                          ? "status-online"
                          : "status-offline"
                      }`}
                    ></span>

                    <span
                      className={`status-text ${
                        user.online
                          ? "text-online"
                          : "text-offline"
                      }`}
                    >
                      {user.online
                        ? "Online"
                        : "Offline"}
                    </span>

                    {user.matchPercent > 0 && (
                      <span
                        className="match-badge"
                        title={`${user.matchPercent}% of your interests`}
                      >
                        {user.matchPercent}% match
                      </span>
                    )}

                    {unread > 0 && (
                      <span className="unread-badge">
                        {unread > 99
                          ? "99+"
                          : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-results">
            {search || genderFilter !== "all"
              ? "No users found"
              : "No other users yet"}
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div
        className="profile jsx-style-3"
        onClick={openProfile}
      >
        <div className="avatar small">
          {currentUser?.photo ? (
            <img
              className="jsx-style-4"
              src={currentUser.photo}
              alt={currentUser.name}
            />
          ) : (
            profileInitial
          )}

          <span className="online-dot"></span>
        </div>

        <div className="jsx-style-5">
          <strong>
            {currentUser?.username
              ? `@${currentUser.username}`
              : currentUser?.name || "My Profile"}
          </strong>

          <p className="jsx-style-6">Online</p>
        </div>

        <button
          className="logout-btn"
          onClick={(event) => {
            event.stopPropagation();
            logout();
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;