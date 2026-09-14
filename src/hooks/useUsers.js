import { useEffect, useMemo, useState } from "react";

function useUsers({
  apiUrl,
  currentUser,
  currentUserId,
  setSelectedUser,
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [search, setSearch] =
    useState("");

  const [genderFilter, setGenderFilter] =
    useState("all");

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  useEffect(() => {
    async function loadUsers() {
      const token =
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

      if (!token) {
        setLoadingUsers(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/auth/users`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Could not load users."
          );
        }

        const loggedInUserId =
          String(
            currentUserId ||
              currentUser?.id ||
              currentUser?._id ||
              ""
          );

        const loadedUsers =
          (data.users || [])
            .map((user) => {
              const userId =
                String(
                  user.id ||
                    user._id
                );

              return {
                ...user,

                id: userId,

                online:
                  onlineUsers.includes(
                    userId
                  ),

                initial:
                  user.initial ||
                  user.name
                    ?.charAt(0)
                    .toUpperCase() ||
                  user.username
                    ?.charAt(0)
                    .toUpperCase() ||
                  "U",

                lastMessage:
                  user.lastMessage ||
                  "",

                time:
                  user.time || "",
              };
            })
            .filter(
              (user) =>
                user.id !==
                loggedInUserId
            );

        setUsers(
          loadedUsers
        );

        /*
          IMPORTANT:
          Pehle automatically first user
          select ho raha tha.

          Ab nahi hoga.
          User khud jis user par click
          karega wahi chat open hogi.
        */

        setSelectedUser(null);
      } catch (error) {
        console.error(
          "Load users error:",
          error
        );
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [
    apiUrl,
    currentUser,
    currentUserId,
  ]);

  /*
    ONLINE USERS UPDATE
  */

  useEffect(() => {
    setUsers(
      (previousUsers) =>
        previousUsers.map(
          (user) => {
            const userId =
              String(
                user.id ||
                  user._id
              );

            return {
              ...user,

              online:
                onlineUsers.includes(
                  userId
                ),
            };
          }
        )
    );

    setSelectedUser(
      (previousSelected) => {
        if (!previousSelected) {
          return previousSelected;
        }

        const userId =
          String(
            previousSelected.id ||
              previousSelected._id
          );

        return {
          ...previousSelected,

          online:
            onlineUsers.includes(
              userId
            ),
        };
      }
    );
  }, [
    onlineUsers,
    setSelectedUser,
  ]);

  /*
    UNREAD COUNTS
  */

  useEffect(() => {
    async function loadUnreadCounts() {
      const token =
        sessionStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${apiUrl}/messages/unread/counts`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (response.ok) {
          setUnreadCounts(
            data.counts || {}
          );
        }
      } catch (error) {
        console.error(
          "Unread count error:",
          error
        );
      }
    }

    loadUnreadCounts();
  }, [apiUrl]);

  /*
    FILTER
  */

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return users.filter(
        (user) => {
          const matchesSearch =
            user.name
              ?.toLowerCase()
              .includes(query) ||
            user.username
              ?.toLowerCase()
              .includes(query);

          const matchesGender =
            genderFilter ===
              "all" ||
            user.gender ===
              genderFilter;

          return (
            matchesSearch &&
            matchesGender
          );
        }
      );
    }, [
      users,
      search,
      genderFilter,
    ]);

  return {
    users,
    setUsers,

    loadingUsers,

    unreadCounts,
    setUnreadCounts,

    search,
    setSearch,

    genderFilter,
    setGenderFilter,

    filteredUsers,

    onlineUsers,
    setOnlineUsers,
  };
}

export default useUsers;