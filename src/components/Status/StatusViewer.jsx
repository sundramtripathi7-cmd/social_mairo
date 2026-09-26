import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  STATUS_DURATION_MS,
  authorIdOf,
  formatTimeAgo,
  statusFontSize,
  userIdOf,
} from "./statusUtils";

function StatusViewer({
  slides,
  initialGroupIndex,
  initialStatusIndex,
  posts,
  currentUser,
  onClose,
  onView,
  onDelete,
  onLike,
  deleting,
  liking,
}) {
  const [groupIndex, setGroupIndex] = useState(
    initialGroupIndex
  );
  const [statusIndex, setStatusIndex] = useState(
    initialStatusIndex
  );
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const goRef = useRef(() => {});
  const onViewRef = useRef(onView);
  const onCloseRef = useRef(onClose);
  const holdStartedRef = useRef(0);
  const stageRef = useRef(null);

  const currentUserId = userIdOf(currentUser);

  const postsById = useMemo(() => {
    const map = new Map();

    posts.forEach((post) => {
      map.set(String(post._id), post);
    });

    return map;
  }, [posts]);

  const playlist = useMemo(() => {
    return slides
      .map((slide) => {
        const statuses = slide.statusIds
          .map((id) => postsById.get(String(id)))
          .filter(Boolean);

        if (statuses.length === 0) {
          return null;
        }

        return {
          authorId: slide.authorId,
          author: statuses[0].author || slide.author,
          statuses,
        };
      })
      .filter(Boolean);
  }, [slides, postsById]);

  const safeGroupIndex = Math.min(
    groupIndex,
    Math.max(playlist.length - 1, 0)
  );

  const group = playlist[safeGroupIndex];

  const safeStatusIndex = group
    ? Math.min(
        statusIndex,
        group.statuses.length - 1
      )
    : 0;

  const status = group?.statuses[safeStatusIndex];

  const isOwn =
    Boolean(status) &&
    authorIdOf(status) === currentUserId;

  const likes = Array.isArray(status?.likes)
    ? status.likes
    : [];

  const isLiked = likes.some(
    (id) => String(id) === currentUserId
  );

  const statusId = status?._id;

  const go = useCallback((delta) => {
    if (!playlist.length) {
      onClose();
      return;
    }

    let nextGroup = safeGroupIndex;
    let nextStatus = safeStatusIndex + delta;
    const current = playlist[nextGroup];

    if (!current) {
      onClose();
      return;
    }

    if (nextStatus >= current.statuses.length) {
      nextGroup += 1;
      nextStatus = 0;
    }

    if (nextStatus < 0) {
      nextGroup -= 1;

      if (nextGroup < 0) {
        setGroupIndex(0);
        setStatusIndex(0);
        setProgress(0);
        elapsedRef.current = 0;
        return;
      }

      nextStatus =
        playlist[nextGroup].statuses.length - 1;
    }

    if (nextGroup >= playlist.length) {
      onClose();
      return;
    }

    setShowViewers(false);
    setGroupIndex(nextGroup);
    setStatusIndex(nextStatus);
    setProgress(0);
    elapsedRef.current = 0;
  }, [
    onClose,
    playlist,
    safeGroupIndex,
    safeStatusIndex,
  ]);

  useEffect(() => {
    pausedRef.current = paused || showViewers;
    goRef.current = go;
    onViewRef.current = onView;
    onCloseRef.current = onClose;
  }, [paused, showViewers, go, onView, onClose]);

  useEffect(() => {
    if (!playlist.length) {
      onCloseRef.current();
    }
  }, [playlist.length]);

  useEffect(() => {
    if (!statusId) {
      return undefined;
    }

    if (!isOwn) {
      onViewRef.current(statusId);
    }

    elapsedRef.current = 0;

    let last = performance.now();
    let frame = 0;
    let stopped = false;

    const step = (now) => {
      if (stopped) {
        return;
      }

      const delta = now - last;

      last = now;

      if (!pausedRef.current) {
        elapsedRef.current += delta;

        const value = Math.min(
          1,
          elapsedRef.current / STATUS_DURATION_MS
        );

        setProgress(value);

        if (value >= 1) {
          goRef.current(1);
          return;
        }
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
  }, [statusId, isOwn]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        goRef.current(1);
      }

      if (event.key === "ArrowLeft") {
        goRef.current(-1);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [onClose]);

  if (!status || !group) {
    return null;
  }

  const viewers = Array.isArray(status.viewers)
    ? status.viewers
    : [];

  function onPointerDown(event) {
    if (
      event.target.closest(
        "button, input, textarea, a"
      )
    ) {
      return;
    }

    holdStartedRef.current = Date.now();
    setPaused(true);
  }

  function onPointerUp(event) {
    if (
      event.target.closest(
        "button, input, textarea, a"
      )
    ) {
      return;
    }

    const held = Date.now() - holdStartedRef.current;

    setPaused(false);

    if (held > 220) {
      return;
    }

    const rect =
      stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const x = event.clientX - rect.left;

    if (x < rect.width * 0.33) {
      go(-1);
    } else {
      go(1);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this status?"
    );

    if (!confirmed) {
      return;
    }

    await onDelete(status._id);
  }

  return (
    <div className="status-stage is-viewing">
      <div
        className="status-viewer"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setPaused(false)}
        onContextMenu={(event) =>
          event.preventDefault()
        }
      >
        <div className="status-progress-row">
          {group.statuses.map((item, index) => {
            let width = "0%";

            if (index < safeStatusIndex) {
              width = "100%";
            } else if (index === safeStatusIndex) {
              width = `${progress * 100}%`;
            }

            return (
              <div
                key={item._id}
                className="status-progress-track"
              >
                <div
                  className="status-progress-fill"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        <header className="status-viewer-header">
          <div className="status-viewer-user">
            <div className="status-viewer-avatar">
              {group.author?.photo ? (
                <img
                  src={group.author.photo}
                  alt=""
                />
              ) : (
                group.author?.username
                  ?.charAt(0)
                  .toUpperCase() || "U"
              )}
            </div>

            <div>
              <strong>
                {isOwn
                  ? "My status"
                  : `@${group.author?.username || "user"}`}
              </strong>
              <span>
                {formatTimeAgo(status.createdAt)}
              </span>
            </div>
          </div>

          <div className="status-viewer-actions">
            {isOwn && (
              <button
                type="button"
                className="status-icon-btn"
                onClick={handleDelete}
                disabled={
                  deleting &&
                  String(deleting) === String(status._id)
                }
                aria-label="Delete status"
              >
                🗑
              </button>
            )}

            <button
              type="button"
              className="status-icon-btn"
              onClick={onClose}
              aria-label="Close status"
            >
              ×
            </button>
          </div>
        </header>

        {status.image ? (
          <div className="status-media">
            <img
              src={status.image}
              alt=""
              draggable="false"
            />

            {status.text && (
              <div className="status-caption">
                {status.text}
              </div>
            )}
          </div>
        ) : (
          <div
            className="status-text-slide"
            style={{
              background:
                status.background || "#075e54",
            }}
          >
            <p
              style={{
                fontSize: statusFontSize(status.text),
              }}
            >
              {status.text}
            </p>
          </div>
        )}

        {isOwn ? (
          <div className="status-viewer-footer">
            <button
              type="button"
              className="status-viewers-btn"
              onClick={() =>
                setShowViewers((open) => !open)
              }
            >
              👁 {viewers.length}
            </button>

            {showViewers && (
              <div className="status-viewers-sheet">
                <strong>Viewed by {viewers.length}</strong>

                {viewers.length === 0 ? (
                  <p>No views yet</p>
                ) : (
                  <ul>
                    {viewers.map((viewer) => {
                      const viewerId = String(
                        viewer._id || viewer.id || viewer
                      );

                      return (
                        <li key={viewerId}>
                          <span className="status-viewer-mini">
                            {viewer.photo ? (
                              <img
                                src={viewer.photo}
                                alt=""
                              />
                            ) : (
                              viewer.username
                                ?.charAt(0)
                                .toUpperCase() || "U"
                            )}
                          </span>
                          @{viewer.username || "user"}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="status-viewer-footer">
            <button
              type="button"
              className={`status-like-btn ${
                isLiked ? "liked" : ""
              }`}
              onClick={() => onLike(status._id)}
              disabled={
                liking &&
                String(liking) === String(status._id)
              }
              aria-label={
                isLiked ? "Unlike status" : "Like status"
              }
            >
              {isLiked ? "❤️" : "🤍"}
              <span>{likes.length}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusViewer;
