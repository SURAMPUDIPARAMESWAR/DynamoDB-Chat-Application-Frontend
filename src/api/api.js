const API_URL = import.meta.env.VITE_API_URL;


// =====================================================
// TOKEN
// =====================================================

const getToken = () => {
    return localStorage.getItem(
        "dynamodb_chat_token"
    );
};


// =====================================================
// COMMON API REQUEST
// =====================================================

const apiRequest = async (
    endpoint,
    options = {}
) => {

    const token = getToken();


    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    // Add JWT token
    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    let result = {};


    try {

        result =
            await response.json();

    } catch {

        result = {};
    }


    // =================================================
    // HANDLE ERRORS
    // =================================================

    if (!response.ok) {

    console.error("API ERROR:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        result
    });

    if (response.status === 401) {
        localStorage.removeItem(
            "dynamodb_chat_token"
        );

        localStorage.removeItem(
            "dynamodb_current_user"
        );
    }

    throw new Error(
        result.message ||
        `Request failed: ${response.status} ${response.statusText}`
    );
}


    return result;
};


// =====================================================
// AUTH API
// =====================================================

export const authApi = {

    // Register
    register: (data) =>
        apiRequest(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        ),


    // Login
    login: (data) =>
        apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify(data)
            }
        )
};


// =====================================================
// USER API
// =====================================================

export const userApi = {

    // Current logged-in user
    getMe: () =>
        apiRequest(
            "/users/me"
        ),


    // All users
    getAll: () =>
        apiRequest(
            "/users"
        )
};


// =====================================================
// CHAT API
// =====================================================

export const chatApi = {
    create: (data) =>
        apiRequest("/chats", {
            method: "POST",
            body: JSON.stringify(data)
        }),

    getMyChats: () =>
        apiRequest("/chats/my-chats"),

    getChat: (chatId) =>
        apiRequest(`/chats/${chatId}`),

    getMembers: (chatId) =>
        apiRequest(`/chats/${chatId}/members`),

    delete: (chatId) =>
        apiRequest(`/chats/${chatId}`, {
            method: "DELETE"
        }),

    leave: (chatId) =>
        apiRequest(`/chats/${chatId}/leave`, {
            method: "DELETE"
        })
};


// =====================================================
// MESSAGE API
// =====================================================

export const messageApi = {

    // Send message
    send: (
        chatId,
        message
    ) =>
        apiRequest(
            `/messages/${chatId}`,
            {
                method: "POST",
                body: JSON.stringify({
                    message
                })
            }
        ),


    // Get messages
    getMessages: (
        chatId,
        limit = 20,
        cursor = null
    ) => {

        let endpoint =
            `/messages/${chatId}?limit=${limit}`;


        if (cursor) {

            endpoint +=
                `&cursor=${encodeURIComponent(
                    cursor
                )}`;
        }


        return apiRequest(
            endpoint
        );
    },


    // Get specific message
    getById: (
        chatId,
        messageId
    ) =>
        apiRequest(
            `/messages/${chatId}/${messageId}`
        ),


    // Delete specific message
    delete: (
        chatId,
        messageId
    ) =>
        apiRequest(
            `/messages/${chatId}/${messageId}`,
            {
                method: "DELETE"
            }
        )
};


// =====================================================
// LOGOUT / CLEAR AUTH
// =====================================================

export const clearAuth = () => {

    localStorage.removeItem(
        "dynamodb_chat_token"
    );


    localStorage.removeItem(
        "dynamodb_current_user"
    );
};