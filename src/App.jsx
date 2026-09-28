import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const chatId = "201";
  const currentUserId = "101";

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/chats/${chatId}/messages`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load messages");
      }

      setMessages(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async () => {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            senderId: currentUserId,
            message: cleanMessage
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send message");
      }

      setMessages((previousMessages) => [
        result.data,
        ...previousMessages
      ]);

      setMessageText("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="app">

      <header className="header">
        <h1>DynamoDB Chat Application</h1>
        <span>Node.js + Express + DynamoDB</span>
      </header>

      <main className="chat-layout">

        <aside className="sidebar">
          <h2>Chats</h2>

          <div className="chat-item active">
            <strong>Project Team</strong>
            <p>2 members</p>
          </div>
        </aside>

        <section className="chat-window">

          <div className="chat-header">
            <h2>Project Team</h2>
            <span>Chat ID: {chatId}</span>
          </div>

          <div className="messages">

            {loading && (
              <p className="status">
                Loading messages...
              </p>
            )}

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              messages.length === 0 && (
                <p className="status">
                  No messages yet.
                </p>
              )}

            {!loading &&
              messages.map((item) => (
                <div
                  key={item.messageId}
                  className={
                    item.senderId === currentUserId
                      ? "message sent"
                      : "message received"
                  }
                >
                  <strong>
                    {item.senderId === currentUserId
                      ? "Parameswar"
                      : `User ${item.senderId}`}
                  </strong>

                  <p>{item.message}</p>

                  <small>
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              ))}

          </div>

          <div className="message-input">

            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(event) =>
                setMessageText(event.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={sending}
            />

            <button
              onClick={sendMessage}
              disabled={sending || !messageText.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;