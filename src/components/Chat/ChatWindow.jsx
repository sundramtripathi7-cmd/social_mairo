import EmojiPicker from "emoji-picker-react";

function ChatWindow({
  selectedUser,
  selectedUserIsOnline,
  selectedUserIsTyping,
  messages,
  loadingMessages,
  message,
  setMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  notificationEnabled,
  enableNotifications,
  messageInputRef,
  handleTyping,
  handleKeyDown,
  sendMessage,
  sending,
  deleteMessage,
  messagesEndRef,
  setSelectedUser,
}) {
  return (
    <main className="chat-area">
      {selectedUser ? (
        <>
          <header className="chat-header">
            <button
              type="button"
              className="mobile-back-btn"
              onClick={() => setSelectedUser(null)}
              aria-label="Back to chats"
            >
              ←
            </button>

            {/* Chat header profile photo */}
            <div className="avatar">
              {selectedUser.photo ? (
                <img
                  src={selectedUser.photo}
                  alt={`@${selectedUser.username}`}
                  className="chat-header-photo"
                />
              ) : (
                selectedUser.initial ||
                selectedUser.name?.charAt(0).toUpperCase() ||
                selectedUser.username
                  ?.charAt(0)
                  .toUpperCase() ||
                "U"
              )}

              {selectedUserIsOnline && (
                <span className="online-dot"></span>
              )}
            </div>

            <div>
              <strong>@{selectedUser.username}</strong>

              <p>
                {selectedUserIsTyping
                  ? "typing..."
                  : selectedUserIsOnline
                  ? "Online"
                  : "Offline"}
              </p>
            </div>

            <div className="header-actions">
              <button type="button" title="Search">
                🔍
              </button>

              <button type="button" title="More">
                ⋮
              </button>
            </div>
          </header>

          <section className="messages">
            <div className="today">Today</div>

            {loadingMessages ? (
              <div className="no-messages">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">
                Start a conversation with @
                {selectedUser.username}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.type}`}
                >
                  <p>{msg.text}</p>

                  <span>
                    {msg.time}

                    {msg.type === "sent" && (
                      <span>
                        {" "}
                        {msg.read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>

                  {msg.type === "sent" && (
                    <button
                      type="button"
                      onClick={() =>
                        deleteMessage(msg.id)
                      }
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}

            <div ref={messagesEndRef} />
          </section>

          <div className="message-input">
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  theme="dark"
                  width={320}
                  height={400}
                  onEmojiClick={(emojiObject) => {
                    setMessage(
                      (previous) =>
                        previous +
                        emojiObject.emoji
                    );
                  }}
                />
              </div>
            )}

            <button
              type="button"
              className="input-action"
              onClick={() =>
                setShowEmojiPicker(
                  (previous) => !previous
                )
              }
              title="Emoji"
            >
              😊
            </button>

            <button
              type="button"
              className="input-action"
              onClick={enableNotifications}
              title={
                notificationEnabled
                  ? "Notifications enabled"
                  : "Enable notifications"
              }
            >
              {notificationEnabled
                ? "🔔"
                : "🔕"}
            </button>

            <button
              type="button"
              className="input-action"
              title="Attach file"
            >
              📎
            </button>

            <input
              ref={messageInputRef}
              type="text"
              placeholder={`Message @${selectedUser.username}...`}
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="send-btn"
              onClick={sendMessage}
              disabled={sending}
            >
              {sending ? "..." : "➤"}
            </button>
          </div>
        </>
      ) : (
        <div className="no-chat-selected">
          <div>💬</div>

          <h2>No conversation selected</h2>

          <p>
            Create another account to start chatting.
          </p>
        </div>
      )}
    </main>
  );
}

export default ChatWindow;