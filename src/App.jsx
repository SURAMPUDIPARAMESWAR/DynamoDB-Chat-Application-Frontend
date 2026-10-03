import { useEffect, useState } from "react";
import "./App.css";

import {
    authApi,
    userApi,
    chatApi,
    messageApi,
    clearAuth
} from "./api/api";


// =====================================================
// APP
// =====================================================

function App() {

    const [currentUser, setCurrentUser] = useState(null);

    const [token, setToken] = useState(
        localStorage.getItem("dynamodb_chat_token")
    );

    const [loading, setLoading] = useState(true);


    // =================================================
    // RESTORE LOGIN SESSION
    // =================================================

    useEffect(() => {

        const restoreSession = async () => {

            if (!token) {

                setLoading(false);

                return;
            }


            try {

                const result =
                    await userApi.getMe();


                setCurrentUser(result.user);


                localStorage.setItem(
                    "dynamodb_current_user",
                    JSON.stringify(result.user)
                );

            } catch (error) {

                console.error(
                    "Session restore failed:",
                    error
                );


                clearAuth();

                setToken(null);

                setCurrentUser(null);

            } finally {

                setLoading(false);
            }
        };


        restoreSession();

    }, [token]);


    // =================================================
    // LOGIN
    // =================================================

    const handleLogin = async (
        loginId,
        password
    ) => {

        const result =
            await authApi.login({
                loginId,
                password
            });


        localStorage.setItem(
            "dynamodb_chat_token",
            result.token
        );


        localStorage.setItem(
            "dynamodb_current_user",
            JSON.stringify(result.user)
        );


        setToken(result.token);

        setCurrentUser(result.user);
    };


    // =================================================
    // REGISTER
    // =================================================

    const handleRegister = async (
        name,
        loginId,
        password
    ) => {

        await authApi.register({
            name,
            loginId,
            password
        });
    };


    // =================================================
    // LOGOUT
    // =================================================

    const handleLogout = () => {

        clearAuth();

        setToken(null);

        setCurrentUser(null);
    };


    // =================================================
    // LOADING
    // =================================================

    if (loading) {

        return (
            <div className="loading-screen">
                Loading...
            </div>
        );
    }


    // =================================================
    // AUTHENTICATION
    // =================================================

    if (!currentUser) {

        return (
            <AuthScreen
                onLogin={handleLogin}
                onRegister={handleRegister}
            />
        );
    }


    // =================================================
    // CHAT APPLICATION
    // =================================================

    return (
        <ChatApplication
            currentUser={currentUser}
            onLogout={handleLogout}
        />
    );
}


// =====================================================
// AUTH SCREEN
// =====================================================

function AuthScreen({
    onLogin,
    onRegister
}) {

    const [mode, setMode] =
        useState("login");


    const [name, setName] =
        useState("");


    const [loginId, setLoginId] =
        useState("");


    const [password, setPassword] =
        useState("");


    const [confirmPassword, setConfirmPassword] =
        useState("");


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    // =================================================
    // RESET FORM
    // =================================================

    const resetForm = () => {

        setName("");

        setLoginId("");

        setPassword("");

        setConfirmPassword("");

        setError("");

        setSuccess("");
    };


    // =================================================
    // SWITCH LOGIN / REGISTER
    // =================================================

    const switchMode = () => {

        resetForm();

        setMode(
            mode === "login"
                ? "register"
                : "login"
        );
    };


    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        try {

            setLoading(true);


            // =========================================
            // REGISTER
            // =========================================

            if (mode === "register") {

                if (
                    !name.trim() ||
                    !loginId.trim() ||
                    !password
                ) {

                    throw new Error(
                        "All fields are required"
                    );
                }


                if (password.length < 8) {

                    throw new Error(
                        "Password must contain at least 8 characters"
                    );
                }


                if (
                    password !==
                    confirmPassword
                ) {

                    throw new Error(
                        "Passwords do not match"
                    );
                }


                await onRegister(
                    name.trim(),
                    loginId.trim(),
                    password
                );


                setSuccess(
                    "Registration successful. You can now login."
                );


                setMode("login");

                setName("");

                setPassword("");

                setConfirmPassword("");

                return;
            }


            // =========================================
            // LOGIN
            // =========================================

            if (
                !loginId.trim() ||
                !password
            ) {

                throw new Error(
                    "Login ID and password are required"
                );
            }


            await onLogin(
                loginId.trim(),
                password
            );

        } catch (error) {

            setError(
                error.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="auth-container">

            <div className="auth-card">

                <div className="auth-header">

                    <h1>
                        DynamoChat
                    </h1>

                    <p>
                        DynamoDB Single-Table
                        Chat Application
                    </p>

                </div>


                {/* =================================
                    AUTH TABS
                ================================== */}

                <div className="auth-tabs">

                    <button
                        className={
                            mode === "login"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            resetForm();

                            setMode("login");
                        }}
                    >
                        Login
                    </button>


                    <button
                        className={
                            mode === "register"
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            resetForm();

                            setMode("register");
                        }}
                    >
                        Register
                    </button>

                </div>


                {/* =================================
                    FORM
                ================================== */}

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    {/* NAME */}

                    {mode === "register" && (

                        <div className="form-group">

                            <label>
                                Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your name"
                            />

                        </div>
                    )}


                    {/* LOGIN ID */}

                    <div className="form-group">

                        <label>
                            Login ID
                        </label>

                        <input
                            type="text"
                            value={loginId}
                            onChange={(e) =>
                                setLoginId(
                                    e.target.value
                                )
                            }
                            placeholder="Enter your login ID"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter your password"
                        />

                    </div>


                    {/* CONFIRM PASSWORD */}

                    {mode === "register" && (

                        <div className="form-group">

                            <label>
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Confirm your password"
                            />

                        </div>
                    )}


                    {/* ERROR */}

                    {error && (

                        <div className="error-message">
                            {error}
                        </div>
                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="success-message">
                            {success}
                        </div>
                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? "Login"
                                : "Create Account"}
                    </button>

                </form>


                {/* =================================
                    FOOTER
                ================================== */}

                <div className="auth-footer">

                    {mode === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}

                    <button
                        type="button"
                        onClick={switchMode}
                    >
                        {mode === "login"
                            ? "Register"
                            : "Login"}
                    </button>

                </div>

            </div>

        </div>
    );
}


// =====================================================
// CHAT APPLICATION
// =====================================================

function ChatApplication({
    currentUser,
    onLogout
}) {

    const [users, setUsers] =
        useState([]);


    const [chats, setChats] =
        useState([]);


    const [selectedChat, setSelectedChat] =
        useState(null);


    const [members, setMembers] =
        useState([]);


    const [messages, setMessages] =
        useState([]);


    const [nextCursor, setNextCursor] =
        useState(null);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [messageText, setMessageText] =
        useState("");


    const [showNewChat, setShowNewChat] =
        useState(false);


    // =================================================
    // LOAD INITIAL DATA
    // =================================================

    useEffect(() => {

        loadUsers();

        loadChats();

    }, []);


    // =================================================
    // LOAD USERS
    // =================================================

    const loadUsers = async () => {

        try {

            const result =
                await userApi.getAll();


            setUsers(
                result.data || []
            );

        } catch (error) {

            console.error(
                "Load users error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // LOAD CHATS
    // =================================================

    const loadChats = async () => {

        try {

            const result =
                await chatApi.getMyChats();


            setChats(
                result.data || []
            );

        } catch (error) {

            console.error(
                "Load chats error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // SELECT CHAT
    // =================================================

    const selectChat = async (chat) => {

        try {

            setSelectedChat(chat);

            setMessages([]);

            setMembers([]);

            setNextCursor(null);

            setLoading(true);


            // =========================================
            // LOAD MEMBERS
            // =========================================

            const memberResult =
                await chatApi.getMembers(
                    chat.chatId
                );


            const memberItems =
                memberResult.data || [];


            const memberUsers =
                memberItems
                    .map((member) =>
                        users.find(
                            (user) =>
                                user.userId ===
                                member.userId
                        )
                    )
                    .filter(Boolean);


            setMembers(
                memberUsers
            );


            // =========================================
            // LOAD MESSAGES
            // =========================================

            const messageResult =
                await messageApi.getMessages(
                    chat.chatId,
                    20
                );


            const loadedMessages =
                messageResult.data || [];


            // API returns newest first.
            // UI displays oldest -> newest.

            setMessages(
                [...loadedMessages].reverse()
            );


            setNextCursor(
                messageResult.nextCursor
            );

        } catch (error) {

            console.error(
                "Select chat error:",
                error
            );


            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    // =================================================
    // LOAD OLDER MESSAGES
    // =================================================

    const loadOlderMessages = async () => {

        if (
            !selectedChat ||
            !nextCursor
        ) {

            return;
        }


        try {

            const result =
                await messageApi.getMessages(
                    selectedChat.chatId,
                    20,
                    nextCursor
                );


            const olderMessages =
                result.data || [];


            setMessages((previous) => [

                ...[...olderMessages].reverse(),

                ...previous

            ]);


            setNextCursor(
                result.nextCursor
            );

        } catch (error) {

            console.error(
                "Load older messages error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // SEND MESSAGE
    // =================================================

    const sendMessage = async () => {

        const cleanMessage =
            messageText.trim();


        if (
            !cleanMessage ||
            !selectedChat
        ) {

            return;
        }


        try {

            const result =
                await messageApi.send(
                    selectedChat.chatId,
                    cleanMessage
                );


            setMessages((previous) => [

                ...previous,

                result.data

            ]);


            setMessageText("");

        } catch (error) {

            console.error(
                "Send message error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // ENTER KEY
    // =================================================

    const handleMessageKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    };


    // =================================================
    // CREATE CHAT
    // =================================================

    const createChat = async (
        name,
        selectedMemberIds
    ) => {

        try {

            const result =
                await chatApi.create({

                    name,

                    memberIds:
                        selectedMemberIds

                });


            const newChat =
                result.data;


            setChats((previous) => [

                newChat,

                ...previous

            ]);


            setShowNewChat(false);


            await selectChat(
                newChat
            );

        } catch (error) {

            console.error(
                "Create chat error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // DELETE SPECIFIC MESSAGE
    // =================================================

    const handleDeleteMessage = async (
        messageId
    ) => {

        if (!selectedChat) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this message?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await messageApi.delete(
                selectedChat.chatId,
                messageId
            );


            // Remove immediately from UI

            setMessages((previous) =>
                previous.filter(
                    (message) =>
                        message.messageId !==
                        messageId
                )
            );

        } catch (error) {

            console.error(
                "Delete message error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // DELETE ENTIRE CHAT
    // =================================================
    const handleLeaveChat = async () => {
    if (!selectedChat) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to leave "${selectedChat.name}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await chatApi.leave(selectedChat.chatId);

        const updatedChats = chats.filter(
            (chat) => chat.chatId !== selectedChat.chatId
        );

        setChats(updatedChats);
        setSelectedChat(null);
        setMessages([]);
        setMembers([]);

        alert("You have left the chat.");

    } catch (error) {
        console.error("Leave chat error:", error);

        alert(
            error.message ||
            "Failed to leave the chat."
        );
    }
};
    const handleDeleteChat = async () => {

        if (!selectedChat) {
            return;
        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${selectedChat.name}"? This will permanently delete the chat and all its messages.`
            );


        if (!confirmed) {
            return;
        }


        try {

            await chatApi.delete(
                selectedChat.chatId
            );


            // Remove chat from sidebar

            setChats((previous) =>
                previous.filter(
                    (chat) =>
                        chat.chatId !==
                        selectedChat.chatId
                )
            );


            // Clear selected chat

            setSelectedChat(null);

            setMembers([]);

            setMessages([]);

            setNextCursor(null);

            setMessageText("");

        } catch (error) {

            console.error(
                "Delete chat error:",
                error
            );


            setError(
                error.message
            );
        }
    };


    // =================================================
    // CLEAR ERROR
    // =================================================

    const clearError = () => {

        setError("");
    };


    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="app-container">

            {/* =========================================
                HEADER
            ========================================== */}

            <header className="app-header">

                <div className="app-logo">
                    DynamoChat
                </div>


                <div className="user-section">

                    <div className="user-info">

                        <strong>
                            {currentUser.name}
                        </strong>

                        <span>
                            {currentUser.loginId}
                        </span>

                    </div>


                    <button
                        className="logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* =========================================
                MAIN
            ========================================== */}

            <div className="app-body">

                {/* =====================================
                    SIDEBAR
                ===================================== */}

                <aside className="sidebar">

                    <div className="sidebar-header">

                        <h2>
                            Chats
                        </h2>


                        <button
                            className="new-chat-button"
                            onClick={() =>
                                setShowNewChat(true)
                            }
                            title="Create new chat"
                        >
                            +
                        </button>

                    </div>


                    <div className="chat-list">

                        {chats.length === 0 && (

                            <div className="empty-state">
                                No chats yet
                            </div>

                        )}


                        {chats.map((chat) => (

                            <button
                                key={chat.chatId}
                                className={
                                    selectedChat?.chatId ===
                                    chat.chatId
                                        ? "chat-item active"
                                        : "chat-item"
                                }
                                onClick={() =>
                                    selectChat(chat)
                                }
                            >

                                <div className="chat-avatar">

                                    {chat.name
                                        ?.charAt(0)
                                        ?.toUpperCase()}

                                </div>


                                <div className="chat-item-info">

                                    <strong>
                                        {chat.name}
                                    </strong>

                                    <span>
                                        {chat.memberCount}{" "}
                                        {chat.memberCount === 1
                                            ? "member"
                                            : "members"}
                                    </span>

                                </div>

                            </button>

                        ))}

                    </div>

                </aside>


                {/* =====================================
                    CHAT AREA
                ===================================== */}

                <main className="chat-area">

                    {!selectedChat ? (

                        <div className="empty-chat">

                            <div className="empty-chat-icon">
                                💬
                            </div>

                            <h2>
                                Welcome to DynamoChat
                            </h2>

                            <p>
                                Select a chat or create
                                a new conversation.
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* =================================
                                CHAT HEADER
                            ================================== */}

                            <div className="chat-header">
    <div>
        <h2>{selectedChat.name}</h2>
        <span>
            {selectedChat.memberCount} members
        </span>
    </div>

    <div className="chat-header-actions">
        {selectedChat.createdBy === currentUser.userId ? (
            <button
                className="chat-delete-button"
                onClick={handleDeleteChat}
                title="Delete this chat"
            >
                🗑 Delete Chat
            </button>
        ) : (
            <button
                className="chat-leave-button"
                onClick={handleLeaveChat}
                title="Leave this chat"
            >
                🚪 Leave Chat
            </button>
        )}
    </div>
</div>


                            {/* =================================
                                MEMBERS
                            ================================== */}

                            <div className="members-bar">

                                {members.map(
                                    (member) => (

                                        <div
                                            className="member-chip"
                                            key={
                                                member.userId
                                            }
                                        >

                                            <span className="member-avatar">

                                                {member.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase()}

                                            </span>

                                            <span>
                                                {member.name}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>


                            {/* =================================
                                MESSAGES
                            ================================== */}

                            <div className="messages-container">

                                {/* Load older */}

                                {nextCursor && (

                                    <button
                                        className="load-more-button"
                                        onClick={
                                            loadOlderMessages
                                        }
                                    >
                                        Load older messages
                                    </button>

                                )}


                                {/* Loading */}

                                {loading && (

                                    <div className="loading-messages">
                                        Loading...
                                    </div>

                                )}


                                {/* Empty */}

                                {!loading &&
                                    messages.length === 0 && (

                                        <div className="empty-messages">
                                            No messages yet.
                                            <br />
                                            Start the conversation!
                                        </div>

                                    )}


                                {/* Messages */}

                                {messages.map(
                                    (message) => {

                                        const isMine =
                                            message.senderId ===
                                            currentUser.userId;


                                        const sender =
                                            users.find(
                                                (user) =>
                                                    user.userId ===
                                                    message.senderId
                                            );


                                        return (

                                            <div
                                                key={
                                                    message.messageId
                                                }
                                                className={
                                                    isMine
                                                        ? "message-row mine"
                                                        : "message-row"
                                                }
                                            >

                                                {/* Other user avatar */}

                                                {!isMine && (

                                                    <div className="message-avatar">

                                                        {sender?.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            "U"}

                                                    </div>

                                                )}


                                                <div className="message-content">

                                                    {/* Sender name */}

                                                    {!isMine && (

                                                        <div className="message-sender">

                                                            {sender?.name ||
                                                                "Unknown User"}

                                                        </div>

                                                    )}


                                                    {/* Message */}

                                                    <div className="message-bubble">

                                                        <span>
                                                            {message.message}
                                                        </span>


                                                        {/* =================================
                                                            DELETE MESSAGE

                                                            Only sender sees this
                                                        ================================== */}

                                                        {isMine && (

                                                            <button
                                                                className="delete-message-button"
                                                                onClick={() =>
                                                                    handleDeleteMessage(
                                                                        message.messageId
                                                                    )
                                                                }
                                                                title="Delete message"
                                                                aria-label="Delete message"
                                                            >
                                                                🗑
                                                            </button>

                                                        )}

                                                    </div>


                                                    {/* Time */}

                                                    <div className="message-time">

                                                        {new Date(
                                                            message.createdAt
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour:
                                                                    "2-digit",

                                                                minute:
                                                                    "2-digit"
                                                            }
                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>


                            {/* =================================
                                MESSAGE INPUT
                            ================================== */}

                            <div className="message-input-container">

                                <textarea
                                    value={
                                        messageText
                                    }
                                    onChange={(e) =>
                                        setMessageText(
                                            e.target.value
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
                                    onClick={
                                        sendMessage
                                    }
                                    disabled={
                                        !messageText.trim()
                                    }
                                >
                                    Send
                                </button>

                            </div>

                        </>

                    )}

                </main>

            </div>


            {/* =========================================
                ERROR TOAST
            ========================================== */}

            {error && (

                <div className="error-toast">

                    <span>
                        {error}
                    </span>


                    <button
                        onClick={
                            clearError
                        }
                        aria-label="Close error"
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =========================================
                NEW CHAT MODAL
            ========================================== */}

            {showNewChat && (

                <NewChatModal
                    users={users}
                    currentUser={currentUser}
                    onClose={() =>
                        setShowNewChat(false)
                    }
                    onCreate={createChat}
                />

            )}

        </div>
    );
}
const handleLeaveChat = async () => {
    if (!selectedChat) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to leave "${selectedChat.name}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await chatApi.leave(selectedChat.chatId);

        const remainingChats = chats.filter(
            (chat) => chat.chatId !== selectedChat.chatId
        );

        setChats(remainingChats);
        setSelectedChat(null);
        setMessages([]);
        setMembers([]);

        alert("You have left the chat.");

    } catch (error) {
        console.error(
            "Leave chat error:",
            error
        );

        alert(
            error.message ||
            "Failed to leave chat"
        );
    }
};


// =====================================================
// NEW CHAT MODAL
// =====================================================

function NewChatModal({
    users,
    currentUser,
    onClose,
    onCreate
}) {

    const [name, setName] =
        useState("");


    const [selectedUsers, setSelectedUsers] =
        useState([]);


    const [error, setError] =
        useState("");


    // =================================================
    // AVAILABLE USERS
    // =================================================

    const availableUsers =
        users.filter(
            (user) =>
                user.userId !==
                currentUser.userId
        );


    // =================================================
    // TOGGLE USER
    // =================================================

    const toggleUser = (userId) => {

        setSelectedUsers((previous) => {

            if (
                previous.includes(userId)
            ) {

                return previous.filter(
                    (id) =>
                        id !== userId
                );
            }


            return [
                ...previous,
                userId
            ];
        });
    };


    // =================================================
    // CREATE
    // =================================================

    const handleCreate = async () => {

        setError("");


        if (!name.trim()) {

            setError(
                "Chat name is required"
            );

            return;
        }


        if (
            selectedUsers.length === 0
        ) {

            setError(
                "Select at least one member"
            );

            return;
        }


        try {

            await onCreate(
                name.trim(),
                selectedUsers
            );

        } catch (error) {

            setError(
                error.message ||
                "Failed to create chat"
            );
        }
    };


    return (
        <div className="modal-overlay">

            <div className="modal">

                {/* =================================
                    HEADER
                ================================== */}

                <div className="modal-header">

                    <h2>
                        Create New Chat
                    </h2>


                    <button
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                {/* =================================
                    BODY
                ================================== */}

                <div className="modal-body">

                    {/* CHAT NAME */}

                    <div className="form-group">

                        <label>
                            Chat Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                            placeholder="Enter chat name"
                        />

                    </div>


                    {/* USERS */}

                    <div className="form-group">

                        <label>
                            Select Members
                        </label>


                        <div className="user-selection">

                            {availableUsers.length === 0 ? (

                                <p>
                                    No other registered
                                    users available.
                                </p>

                            ) : (

                                availableUsers.map(
                                    (user) => (

                                        <label
                                            className="user-option"
                                            key={
                                                user.userId
                                            }
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedUsers.includes(
                                                        user.userId
                                                    )
                                                }
                                                onChange={() =>
                                                    toggleUser(
                                                        user.userId
                                                    )
                                                }
                                            />


                                            <span>

                                                <strong>
                                                    {user.name}
                                                </strong>

                                                <small>
                                                    {user.loginId}
                                                </small>

                                            </span>

                                        </label>

                                    )
                                )

                            )}

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="error-message">
                            {error}
                        </div>

                    )}

                </div>


                {/* =================================
                    FOOTER
                ================================== */}

                <div className="modal-footer">

                    <button
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>


                    <button
                        className="create-button"
                        onClick={handleCreate}
                    >
                        Create Chat
                    </button>

                </div>

            </div>

        </div>
    );
}


export default App;