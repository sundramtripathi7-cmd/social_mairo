import UserList from "./UserList";

function Sidebar({
  users,
  filteredUsers,
  selectedUserId,
  unreadCounts,
  search,
  setSearch,
  genderFilter,
  setGenderFilter,
  selectUser,
  currentUser,
  showOnline,
  setShowOnline,
  openProfile,
  logout,
  error,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h2>mairochat</h2>

        <button className="new-chat-btn">
          + New
        </button>
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

      {/* ERROR */}
      {error && (
        <p className="jsx-style-2">
          {error}
        </p>
      )}

      {/* GENDER FILTER */}
      <div className="gender-filter">
        <button
          type="button"
          className={
            genderFilter === "all" ? "active" : ""
          }
          onClick={() => setGenderFilter("all")}
        >
          All
        </button>

        <button
          type="button"
          className={
            genderFilter === "male" ? "active" : ""
          }
          onClick={() => setGenderFilter("male")}
        >
          Male
        </button>

        <button
          type="button"
          className={
            genderFilter === "female" ? "active" : ""
          }
          onClick={() => setGenderFilter("female")}
        >
          Female
        </button>
      </div>

      {/* USERS */}
      <div className="chat-list">
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
            {search
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
            currentUser?.name
              ? currentUser.name
                  .charAt(0)
                  .toUpperCase()
              : "U"
          )}

          {showOnline && (
            <span className="online-dot"></span>
          )}
        </div>

        <div className="jsx-style-5">
          <strong>
            {currentUser?.name || "My Profile"}
          </strong>

          <p
            className="jsx-style-6"
            onClick={(event) => {
              event.stopPropagation();

              setShowOnline(
                (previous) => !previous
              );
            }}
          >
            {showOnline
              ? "🟢 Online"
              : "⚫ Invisible"}
          </p>
        </div>

        <button
          className="jsx-style-7"
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            setShowOnline(
              (previous) => !previous
            );
          }}
          title={
            showOnline
              ? "Hide my online status"
              : "Show my online status"
          }
        >
          {showOnline ? "🟢" : "⚫"}
        </button>

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