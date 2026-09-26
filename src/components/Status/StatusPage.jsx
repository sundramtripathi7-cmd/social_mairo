import { useMemo, useState } from "react";

import CreateStatus from "./CreateStatus";
import StatusViewer from "./StatusViewer";
import {
  firstUnseenIndex,
  formatTimeAgo,
  groupStatuses,
  ringGradient,
  unseenCount,
  userIdOf,
} from "./statusUtils";

function PersonAvatar({ user }) {
  const initial =
    user?.username?.charAt(0).toUpperCase() || "U";

  if (user?.photo) {
    return <img src={user.photo} alt="" />;
  }

  return <span>{initial}</span>;
}

function StatusRow({
  user,
  title,
  subtitle,
  ringClass,
  gradient,
  onOpen,
  onAdd,
  addLabel,
}) {
  return (
    <div className="status-row">
      <div className="status-avatar-wrap">
        <button
          type="button"
          className="status-avatar-btn"
          onClick={onOpen}
          aria-label={title}
        >
          <span
            className={`status-ring ${ringClass}`}
            style={
              gradient
                ? { background: gradient }
                : undefined
            }
          >
            <span className="status-ring-gap">
              <span className="status-ring-photo">
                <PersonAvatar user={user} />
              </span>
            </span>
          </span>
        </button>

        {onAdd && (
          <button
            type="button"
            className="status-add-badge"
            onClick={onAdd}
            aria-label={addLabel}
          >
            +
          </button>
        )}
      </div>

      <button
        type="button"
        className="status-row-copy"
        onClick={onOpen}
      >
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </button>
    </div>
  );
}

function StatusPage({
  currentUser,
  posts,
  loadingPosts,
  creatingPost,
  deletingPostId,
  likingPostId,
  postError,
  setPostError,
  createPost,
  deletePost,
  likePost,
  viewStatus,
  loadPosts,
  openProfile,
  logout,
  openChatView,
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [session, setSession] = useState(null);

  const currentUserId = userIdOf(currentUser);

  const groups = useMemo(
    () => groupStatuses(posts),
    [posts]
  );

  const myGroup =
    groups.find(
      (group) => group.authorId === currentUserId
    ) || null;

  const otherGroups = groups.filter(
    (group) => group.authorId !== currentUserId
  );

  const recent = otherGroups.filter(
    (group) => unseenCount(group.statuses) > 0
  );

  const viewed = otherGroups.filter(
    (group) => unseenCount(group.statuses) === 0
  );

  function openMine() {
    if (!myGroup) {
      setPostError?.("");
      setComposerOpen(true);
      return;
    }

    setSession({
      slides: [
        {
          authorId: myGroup.authorId,
          author: myGroup.author,
          statusIds: myGroup.statuses.map(
            (status) => status._id
          ),
        },
      ],
      groupIndex: 0,
      statusIndex: 0,
    });
  }

  function openUser(groupList, authorId) {
    const start = groupList.findIndex(
      (group) => group.authorId === authorId
    );

    if (start < 0) {
      return;
    }

    const playlist = groupList.slice(start);
    const first = playlist[0];

    setSession({
      slides: playlist.map((group) => ({
        authorId: group.authorId,
        author: group.author,
        statusIds: group.statuses.map(
          (status) => status._id
        ),
      })),
      groupIndex: 0,
      statusIndex: firstUnseenIndex(first.statuses),
    });
  }

  const myLatest = myGroup
    ? myGroup.statuses[myGroup.statuses.length - 1]
    : null;

  const myRing =
    myGroup && myGroup.statuses.length > 1
      ? ringGradient(myGroup.statuses.length, myGroup.statuses.length)
      : "";

  return (
    <>
      <aside
        className={`status-list-panel ${
          session ? "is-viewing" : ""
        }`}
      >
        <header className="status-list-header">
          <div>
            <h1>Status</h1>
            <p>Updates disappear after 24 hours</p>
          </div>

          <button
            type="button"
            className="feed-refresh-btn"
            onClick={() => loadPosts?.()}
            aria-label="Refresh status"
          >
            ↻
          </button>
        </header>

        {postError && !composerOpen && (
          <div className="feed-error" role="alert">
            {postError}
          </div>
        )}

        <div className="status-list-scroll">
          {loadingPosts ? (
            <div className="feed-loading">
              <p>Loading status...</p>
            </div>
          ) : (
            <>
              <StatusRow
                user={currentUser}
                title="My status"
                subtitle={
                  myLatest
                    ? formatTimeAgo(myLatest.createdAt)
                    : "Tap to add status update"
                }
                ringClass={myGroup ? "unseen" : "empty"}
                gradient={myRing}
                onOpen={openMine}
                onAdd={() => {
                  setPostError?.("");
                  setComposerOpen(true);
                }}
                addLabel="Add status"
              />

              <section className="status-section">
                <h2>Recent updates</h2>

                {recent.length === 0 ? (
                  <p className="status-section-empty">
                    No new status updates
                  </p>
                ) : (
                  recent.map((group) => {
                    const latest =
                      group.statuses[
                        group.statuses.length - 1
                      ];
                    const unseen = unseenCount(
                      group.statuses
                    );

                    return (
                      <StatusRow
                        key={group.authorId}
                        user={group.author}
                        title={`@${
                          group.author?.username || "user"
                        }`}
                        subtitle={formatTimeAgo(
                          latest.createdAt
                        )}
                        ringClass="unseen"
                        gradient={ringGradient(
                          group.statuses.length,
                          unseen
                        )}
                        onOpen={() =>
                          openUser(
                            [...recent, ...viewed],
                            group.authorId
                          )
                        }
                      />
                    );
                  })
                )}
              </section>

              {viewed.length > 0 && (
                <section className="status-section">
                  <h2>Viewed updates</h2>

                  {viewed.map((group) => {
                    const latest =
                      group.statuses[
                        group.statuses.length - 1
                      ];

                    return (
                      <StatusRow
                        key={group.authorId}
                        user={group.author}
                        title={`@${
                          group.author?.username || "user"
                        }`}
                        subtitle={formatTimeAgo(
                          latest.createdAt
                        )}
                        ringClass="seen"
                        gradient={ringGradient(
                          group.statuses.length,
                          0
                        )}
                        onOpen={() =>
                          openUser(viewed, group.authorId)
                        }
                      />
                    );
                  })}
                </section>
              )}
            </>
          )}
        </div>

        <div className="status-list-footer">
          <button
            type="button"
            className="feed-nav-profile"
            onClick={openProfile}
          >
            <div className="feed-nav-avatar">
              <PersonAvatar user={currentUser} />
            </div>

            <div>
              <strong>
                @{currentUser?.username || "user"}
              </strong>
              <span>My Profile</span>
            </div>
          </button>

          <button
            type="button"
            className="feed-back-chat-btn"
            onClick={openChatView}
          >
            Back to Chats
          </button>

          <button
            type="button"
            className="feed-logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      {session ? (
        <StatusViewer
          key={`${session.slides
            .map((slide) => slide.authorId)
            .join("-")}:${session.statusIndex}`}
          slides={session.slides}
          initialGroupIndex={session.groupIndex}
          initialStatusIndex={session.statusIndex}
          posts={posts}
          currentUser={currentUser}
          onClose={() => setSession(null)}
          onView={viewStatus}
          onDelete={deletePost}
          onLike={likePost}
          deleting={deletingPostId}
          liking={likingPostId}
        />
      ) : (
        <main className="status-stage">
          <div className="status-stage-empty">
            <div className="status-stage-ring" />
            <h2>Status</h2>
            <p>
              Tap a status to view updates.
              They disappear after 24 hours.
            </p>
          </div>
        </main>
      )}

      {composerOpen && (
        <CreateStatus
          onClose={() => setComposerOpen(false)}
          onCreatePost={createPost}
          creating={creatingPost}
          postError={postError}
        />
      )}
    </>
  );
}

export default StatusPage;
