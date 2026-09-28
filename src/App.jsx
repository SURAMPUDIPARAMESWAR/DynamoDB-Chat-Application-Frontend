import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function App() {
  // =========================================================
  // USER STATE
  // =========================================================

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("dynamodb_current_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to restore user:", error);
      return null;
    }
  });

  const [userIdInput, setUserIdInput] = useState("");

  // Registration
  const [registerUserId, setRegisterUserId] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // =========================================================
  // CHAT STATE
  // =========================================================

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // =========================================================
  // NEW CHAT STATE
  // =========================================================

  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [newChatName, setNewChatName] = useState("");
  const [newChatLoading, setNewChatLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newChatError, setNewChatError] = useState("");

  // =========================================================
  // MESSAGE STATE
  // =========================================================

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [nextCursor, setNextCursor] = useState(null);

  // =========================================================
  // MEMBER STATE
  // =========================================================

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  const messagesContainerRef = useRef(null);
  const shouldScrollToBottom = useRef(true);

  // =========================================================
  // USER LOGIN
  // =========================================================

  const handleLogin = async (event) => {
    event?.preventDefault();

    const userId = userIdInput.trim();

    if (!userId) {
      setLoginError("Please enter your User ID.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/users/${userId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "User not found");
      }

      setCurrentUser(result.data);

      localStorage.setItem(
        "dynamodb_current_user",
        JSON.stringify(result.data)
      );

      setUserIdInput("");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // =========================================================
  // USER REGISTRATION
  // =========================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    const userId = registerUserId.trim();
    const name = registerName.trim();
    const email = registerEmail.trim();

    setRegisterError("");
    setRegisterSuccess("");

    if (!userId || !name || !email) {
      setRegisterError("User ID, name and email are required.");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to register user"
        );
      }

      setRegisterSuccess(
        "Registration successful! You can now login."
      );

      setRegisterUserId("");
      setRegisterName("");
      setRegisterEmail("");

      setUserIdInput(userId);
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("dynamodb_current_user");

    setCurrentUser(null);
    setChats([]);
    setSelectedChatId(null);
    setMessages([]);
    setMembers([]);
    setUserProfiles({});
    setError("");
    setNextCursor(null);

    setShowNewChat(false);
    setAvailableUsers([]);
    setSelectedMemberIds([]);
    setNewChatName("");
    setNewChatError("");
  };

  // =========================================================
  // LOAD USER CHATS
  // =========================================================

  const loadChats = async () => {
    if (!currentUser?.userId) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/users/${currentUser.userId}/chats`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load chats"
        );
      }

      const chatList = result.data || [];

      setChats(chatList);

      if (chatList.length > 0) {
        setSelectedChatId((previous) => {
          const stillExists = chatList.some(
            (chat) => String(chat.chatId) === String(previous)
          );

          return stillExists
            ? previous
            : chatList[0].chatId;
        });
      } else {
        setSelectedChatId(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // =========================================================
  // LOAD REGISTERED USERS
  // =========================================================

  const loadUsers = async () => {
    setUsersLoading(true);
    setNewChatError("");

    try {
      const response = await fetch(`${API_URL}/users`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load users"
        );
      }

      setAvailableUsers(result.data || []);
    } catch (err) {
      setNewChatError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // =========================================================
  // OPEN NEW CHAT
  // =========================================================

  const openNewChat = async () => {
    setShowNewChat(true);

    setNewChatName("");
    setNewChatError("");

    setSelectedMemberIds([
      String(currentUser.userId),
    ]);

    await loadUsers();
  };

  // =========================================================
  // CLOSE NEW CHAT
  // =========================================================

  const closeNewChat = () => {
    if (newChatLoading) {
      return;
    }

    setShowNewChat(false);
    setNewChatName("");
    setSelectedMemberIds([]);
    setNewChatError("");
  };

  // =========================================================
  // TOGGLE CHAT MEMBER
  // =========================================================

  const toggleMember = (userId) => {
    const id = String(userId);

    // Creator/current user is always included.
    if (id === String(currentUser.userId)) {
      return;
    }

    setSelectedMemberIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (memberId) => memberId !== id
        );
      }

      return [...previous, id];
    });
  };

  // =========================================================
  // CREATE NEW CHAT
  // =========================================================

  const createNewChat = async () => {
    const cleanName = newChatName.trim();

    setNewChatError("");

    if (!cleanName) {
      setNewChatError("Chat name is required.");
      return;
    }

    if (selectedMemberIds.length < 2) {
      setNewChatError(
        "Select at least one other user."
      );
      return;
    }

    setNewChatLoading(true);

    try {
      /*
       * The current backend uses a chatId supplied
       * by the client.
       */
      const chatId = String(Date.now());

      const response = await fetch(
        `${API_URL}/chats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            name: cleanName,
            createdBy: String(currentUser.userId),
            memberIds: selectedMemberIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to create chat"
        );
      }

      // Close modal
      setShowNewChat(false);

      setNewChatName("");
      setSelectedMemberIds([]);
      setNewChatError("");

      // Refresh conversations
      await loadChats();

      // Open newly created chat
      setSelectedChatId(chatId);
    } catch (err) {
      setNewChatError(err.message);
    } finally {
      setNewChatLoading(false);
    }
  };

  // =========================================================
  // LOAD MEMBERS
  // =========================================================

  const loadMembers = async () => {
    if (!selectedChatId) {
      return;
    }

    setMembersLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/chats/${selectedChatId}/members`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load members"
        );
      }

      const memberList = result.data || [];

      setMembers(memberList);

      const profileMap = {};

      await Promise.all(
        memberList.map(async (member) => {
          try {
            const userResponse = await fetch(
              `${API_URL}/users/${member.userId}`
            );

            const userResult =
              await userResponse.json();

            if (
              userResponse.ok &&
              userResult.data
            ) {
              profileMap[member.userId] =
                userResult.data;
            }
          } catch {
            // Ignore individual profile failure.
          }
        })
      );

      setUserProfiles(profileMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setMembersLoading(false);
    }
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  const loadMessages = async (
    chatId,
    cursor = null,
    appendOlder = false
  ) => {
    if (!chatId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      let url =
        `${API_URL}/chats/${chatId}/messages` +
        `?limit=5`;

      if (cursor) {
        url +=
          `&cursor=${encodeURIComponent(cursor)}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load messages"
        );
      }

      const newMessages = result.data || [];

      if (appendOlder) {
        setMessages((previous) => [
          ...newMessages,
          ...previous,
        ]);

        shouldScrollToBottom.current = false;
      } else {
        setMessages(newMessages);
        shouldScrollToBottom.current = true;
      }

      setNextCursor(
        result.nextCursor || null
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD OLDER MESSAGES
  // =========================================================

  const loadOlderMessages = async () => {
    if (
      !selectedChatId ||
      !nextCursor ||
      loading
    ) {
      return;
    }

    await loadMessages(
      selectedChatId,
      nextCursor,
      true
    );
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async () => {
    const cleanMessage =
      messageText.trim();

    if (
      !cleanMessage ||
      !selectedChatId ||
      !currentUser
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/chats/${selectedChatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: currentUser.userId,
            message: cleanMessage,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to send message"
        );
      }

      setMessageText("");

      shouldScrollToBottom.current = true;

      await loadMessages(
        selectedChatId
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // EFFECTS
  // =========================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadChats();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setMembers([]);
      setUserProfiles({});
      setNextCursor(null);
      return;
    }

    loadMessages(selectedChatId);
    loadMembers();
  }, [selectedChatId]);

  useEffect(() => {
    if (
      messagesContainerRef.current &&
      shouldScrollToBottom.current
    ) {
      const container =
        messagesContainerRef.current;

      container.scrollTop =
        container.scrollHeight;
    }
  }, [messages]);

  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleMessageKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // =========================================================
  // USER NAME
  // =========================================================

  const getUserName = (userId) => {
    const profile =
      userProfiles[userId];

    if (profile?.name) {
      return profile.name;
    }

    if (profile?.userName) {
      return profile.userName;
    }

    if (profile?.username) {
      return profile.username;
    }

    if (
      String(currentUser?.userId) ===
      String(userId)
    ) {
      return currentUser.name;
    }

    return `User ${userId}`;
  };

  // =========================================================
  // LOGIN / REGISTRATION SCREEN
  // =========================================================

  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-logo">
            💬
          </div>

          <h1>
            DynamoDB Chat
          </h1>

          <p className="auth-subtitle">
            Single-table chat application
          </p>

          {!showRegister ? (
            <>
              <form
                onSubmit={handleLogin}
              >
                <label>
                  User ID
                </label>

                <input
                  type="text"
                  value={userIdInput}
                  onChange={(event) =>
                    setUserIdInput(
                      event.target.value
                    )
                  }
                  placeholder="Enter your registered User ID"
                />

                {loginError && (
                  <div className="auth-error">
                    {loginError}
                  </div>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading
                    ? "Logging in..."
                    : "Login"}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <button
                className="secondary-button"
                onClick={() => {
                  setShowRegister(true);
                  setLoginError("");
                }}
              >
                Register New User
              </button>

              <div className="demo-users">
                <p>
                  Demo users
                </p>

                <button
                  onClick={() =>
                    setUserIdInput("101")
                  }
                >
                  Parameswar · 101
                </button>

                <button
                  onClick={() =>
                    setUserIdInput("102")
                  }
                >
                  Sai · 102
                </button>
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={handleRegister}
              >
                <label>
                  User ID
                </label>

                <input
                  type="text"
                  value={registerUserId}
                  onChange={(event) =>
                    setRegisterUserId(
                      event.target.value
                    )
                  }
                  placeholder="Example: 103"
                />

                <label>
                  Name
                </label>

                <input
                  type="text"
                  value={registerName}
                  onChange={(event) =>
                    setRegisterName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                />

                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={registerEmail}
                  onChange={(event) =>
                    setRegisterEmail(
                      event.target.value
                    )
                  }
                  placeholder="Enter your email"
                />

                {registerError && (
                  <div className="auth-error">
                    {registerError}
                  </div>
                )}

                {registerSuccess && (
                  <div className="auth-success">
                    {registerSuccess}
                  </div>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={registerLoading}
                >
                  {registerLoading
                    ? "Registering..."
                    : "Register User"}
                </button>
              </form>

              <button
                className="secondary-button"
                onClick={() => {
                  setShowRegister(false);
                  setRegisterError("");
                  setRegisterSuccess("");
                }}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // CHAT APPLICATION
  // =========================================================

  return (
    <div className="chat-app">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="chat-header">

        <div className="brand">

          <div className="brand-icon">
            💬
          </div>

          <div>
            <h2>
              DynamoDB Chat
            </h2>

            <span>
              Single-table messaging
            </span>
          </div>

        </div>


        <div className="current-user">

          <div className="avatar">
            {getInitials(
              currentUser.name
            )}
          </div>

          <div className="current-user-info">

            <strong>
              {currentUser.name}
            </strong>

            <span>
              ID: {currentUser.userId}
            </span>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =====================================================
          CHAT LAYOUT
      ===================================================== */}

      <div className="chat-layout">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="sidebar">

          <div className="sidebar-title">

            <div>
              <h3>
                Conversations
              </h3>

              <span>
                {chats.length} chat
                {chats.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            <button
              className="new-chat-button"
              onClick={openNewChat}
              title="Create new chat"
            >
              +
            </button>

          </div>


          <div className="chat-list">

            {loading &&
              chats.length === 0 && (
                <div className="empty-state">
                  Loading chats...
                </div>
              )}


            {!loading &&
              chats.length === 0 &&
              !error && (
                <div className="empty-state">

                  <div className="empty-icon">
                    💬
                  </div>

                  <strong>
                    No chats yet
                  </strong>

                  <span>
                    Click + to create
                    your first chat.
                  </span>

                </div>
              )}


            {chats.map((chat) => (

              <button
                key={chat.chatId}
                className={`chat-item ${
                  String(selectedChatId) ===
                  String(chat.chatId)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedChatId(
                    chat.chatId
                  )
                }
              >

                <div className="chat-avatar">
                  {getInitials(
                    chat.chatName ||
                      "Chat"
                  )}
                </div>

                <div className="chat-item-info">

                  <strong>
                    {chat.chatName ||
                      `Chat ${chat.chatId}`}
                  </strong>

                  <span>
                    Chat ID:{" "}
                    {chat.chatId}
                  </span>

                </div>

              </button>

            ))}

          </div>

        </aside>


        {/* ===================================================
            MAIN CHAT
        =================================================== */}

        <main className="chat-main">

          {selectedChatId ? (
            <>

              {/* =============================================
                  CHAT HEADER
              ============================================= */}

              <div className="conversation-header">

                <div>

                  <h2>
                    {
                      chats.find(
                        (chat) =>
                          String(
                            chat.chatId
                          ) ===
                          String(
                            selectedChatId
                          )
                      )?.chatName ||
                      `Chat ${selectedChatId}`
                    }
                  </h2>

                  <div className="member-list">

                    {membersLoading ? (
                      <span>
                        Loading members...
                      </span>
                    ) : (
                      members.map(
                        (member) => (
                          <span
                            className="member-chip"
                            key={
                              member.userId
                            }
                          >

                            <span className="mini-avatar">
                              {getInitials(
                                getUserName(
                                  member.userId
                                )
                              )}
                            </span>

                            {getUserName(
                              member.userId
                            )}

                          </span>
                        )
                      )
                    )}

                  </div>

                </div>

              </div>


              {/* =============================================
                  ERROR
              ============================================= */}

              {error && (
                <div className="chat-error">
                  {error}
                </div>
              )}


              {/* =============================================
                  MESSAGES
              ============================================= */}

              <div
                className="messages-container"
                ref={
                  messagesContainerRef
                }
              >

                {nextCursor && (
                  <button
                    className="older-button"
                    onClick={
                      loadOlderMessages
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Loading..."
                      : "Load older messages"}
                  </button>
                )}


                {messages.length === 0 &&
                  !loading && (
                    <div className="empty-messages">

                      <div>
                        💬
                      </div>

                      <strong>
                        No messages yet
                      </strong>

                      <span>
                        Send the first
                        message.
                      </span>

                    </div>
                  )}


                {messages.map(
                  (message) => {

                    const isOwn =
                      String(
                        message.senderId
                      ) ===
                      String(
                        currentUser.userId
                      );

                    return (
                      <div
                        className={`message-row ${
                          isOwn
                            ? "own"
                            : ""
                        }`}
                        key={
                          message.messageId
                        }
                      >

                        {!isOwn && (
                          <div className="message-avatar">
                            {getInitials(
                              getUserName(
                                message.senderId
                              )
                            )}
                          </div>
                        )}


                        <div className="message-content">

                          {!isOwn && (
                            <span className="sender-name">
                              {getUserName(
                                message.senderId
                              )}
                            </span>
                          )}


                          <div className="message-bubble">
                            {message.message}
                          </div>


                          <span className="message-time">

                            {message.createdAt
                              ? new Date(
                                  message.createdAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}

                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>


              {/* =============================================
                  MESSAGE INPUT
              ============================================= */}

              <div className="message-input-area">

                <textarea
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleMessageKeyDown
                  }
                  placeholder="Type a message..."
                  rows={1}
                />

                <button
                  className="send-button"
                  onClick={sendMessage}
                  disabled={
                    sending ||
                    !messageText.trim()
                  }
                >
                  {sending
                    ? "..."
                    : "Send"}
                </button>

              </div>

            </>
          ) : (

            <div className="no-chat-selected">

              <div className="large-chat-icon">
                💬
              </div>

              <h2>
                Welcome,{" "}
                {currentUser.name}
              </h2>

              <p>
                Select a conversation
                to start chatting.
              </p>

              <button
                className="primary-button"
                style={{
                  width: "auto",
                  marginTop: "12px",
                  padding: "10px 18px",
                }}
                onClick={openNewChat}
              >
                + Create New Chat
              </button>

            </div>

          )}

        </main>

      </div>


      {/* =====================================================
          CREATE NEW CHAT MODAL
      ===================================================== */}

      {showNewChat && (

        <div
          className="modal-overlay"
          onClick={closeNewChat}
        >

          <div
            className="new-chat-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  Create New Chat
                </h2>

                <p>
                  Select registered users
                  for this conversation.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeNewChat}
                disabled={
                  newChatLoading
                }
              >
                ×
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="modal-body">

              <label>
                Chat Name
              </label>

              <input
                className="chat-name-input"
                type="text"
                value={newChatName}
                onChange={(event) =>
                  setNewChatName(
                    event.target.value
                  )
                }
                placeholder="Example: Development Team"
                disabled={
                  newChatLoading
                }
              />


              <div className="members-heading">

                <div>

                  <strong>
                    Select Members
                  </strong>

                  <span>
                    {selectedMemberIds.length}{" "}
                    selected
                  </span>

                </div>

              </div>


              {usersLoading ? (

                <div className="users-loading">
                  Loading registered
                  users...
                </div>

              ) : availableUsers.length ===
                0 ? (

                <div className="users-loading">
                  No registered users
                  found.
                </div>

              ) : (

                <div className="users-selection">

                  {availableUsers.map(
                    (user) => {

                      const userId =
                        String(
                          user.userId
                        );

                      const isSelected =
                        selectedMemberIds.includes(
                          userId
                        );

                      const isCurrentUser =
                        userId ===
                        String(
                          currentUser.userId
                        );

                      return (

                        <button
                          type="button"
                          key={userId}
                          className={`user-selection-item ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleMember(
                              userId
                            )
                          }
                          disabled={
                            newChatLoading
                          }
                        >

                          <div className="selection-avatar">

                            {getInitials(
                              user.name ||
                                `User ${userId}`
                            )}

                          </div>


                          <div className="selection-user-info">

                            <strong>
                              {user.name ||
                                `User ${userId}`}
                            </strong>

                            <span>
                              ID: {userId}
                              {isCurrentUser
                                ? " · You"
                                : ""}
                            </span>

                          </div>


                          <div
                            className={`selection-check ${
                              isSelected
                                ? "checked"
                                : ""
                            }`}
                          >
                            {isSelected
                              ? "✓"
                              : ""}
                          </div>

                        </button>

                      );
                    }
                  )}

                </div>

              )}


              {newChatError && (
                <div className="new-chat-error">
                  {newChatError}
                </div>
              )}

            </div>


            {/* MODAL FOOTER */}

            <div className="modal-footer">

              <button
                className="cancel-chat-button"
                onClick={closeNewChat}
                disabled={
                  newChatLoading
                }
              >
                Cancel
              </button>

              <button
                className="create-chat-button"
                onClick={createNewChat}
                disabled={
                  newChatLoading ||
                  !newChatName.trim() ||
                  selectedMemberIds.length < 2
                }
              >
                {newChatLoading
                  ? "Creating..."
                  : "Create Chat"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;