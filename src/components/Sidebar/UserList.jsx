function UserList({
  filteredUsers,
  selectedUserId,
  unreadCounts,
  search,
  selectUser,
}) {
  return (
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

                {/* Online / Offline */}
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
  );
}

export default UserList;