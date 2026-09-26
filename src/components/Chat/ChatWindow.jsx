import { useEffect } from "react";
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
  function scrollMessagesToEnd() {
    const scroller = document.querySelector(
      ".chat-area .messages"
    );

    if (!scroller) {
      return;
    }

    scroller.scrollTop = scroller.scrollHeight;
  }

  function handleInputFocus() {
    setShowEmojiPicker(false);

    window.setTimeout(() => {
      scrollMessagesToEnd();
    }, 280);
  }

  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport || !selectedUser) {
      return undefined;
    }

    function onResize() {
      const scroller = document.querySelector(
        ".chat-area .messages"
      );

      if (!scroller) {
        return;
      }

      const distanceFromBottom =
        scroller.scrollHeight -
        scroller.scrollTop -
        scroller.clientHeight;

      if (distanceFromBottom < 160) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    }

    viewport.addEventListener("resize", onResize);

    return () => {
      viewport.removeEventListener("resize", onResize);
    };
  }, [selectedUser]);

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

            <div
              className={`avatar ${
                selectedUser.isGroup ? "group-avatar" : ""
              }`}
            >
              {selectedUser.isGroup ? (
                <span className="group-avatar-mark">E</span>
              ) : selectedUser.photo ? (
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

              {selectedUserIsOnline && !selectedUser.isGroup && (
                <span className="online-dot"></span>
              )}
            </div>

            <div>
              <strong>
                {selectedUser.isGroup
                  ? "Everyone"
                  : `@${selectedUser.username}`}
              </strong>

              <p>
                {selectedUser.isGroup
                  ? "All users are in this chat"
                  : selectedUserIsTyping
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
                {selectedUser.isGroup
                  ? "Everyone is already here. Say hello."
                  : `Start a conversation with @${selectedUser.username}`}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.type}`}
                >
                  <p>
                    {selectedUser.isGroup &&
                      msg.type === "received" &&
                      msg.senderUsername && (
                        <strong className="message-sender">
                          @{msg.senderUsername}
                        </strong>
                      )}
                    {msg.text}
                  </p>

                  <span>
                    {msg.time}

                    {msg.type === "sent" && !selectedUser.isGroup && (
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

          <form
            className="message-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
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
              className="input-action notification-button"
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

            <input
              ref={messageInputRef}
              type="text"
              placeholder={
                selectedUser.isGroup
                  ? "Message everyone..."
                  : `Message @${selectedUser.username}...`
              }
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              inputMode="text"
            />

            <button
              type="submit"
              className="send-btn"
              disabled={sending || !message.trim()}
            >
              {sending ? "..." : "➤"}
            </button>
          </form>
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
