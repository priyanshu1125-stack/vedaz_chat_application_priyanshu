# Real-Time Chat Application

## Objective

Build a real-time chat application using **React** (web frontend) and **Node.js + Express + Socket.io** (backend) that allows users to:

- Send messages
- Receive messages instantly using Socket.io
- View previous messages after refreshing the application
- Display message timestamps

---

## 1. Frontend (Web or Mobile)

**Technology:** React (Vite) — React Native was not used; a web app is acceptable per the problem statement.

**Chat interface features:**


| Feature                                | Status | Implementation                                                                |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Send messages                          | Done   | Socket.io primary path; REST fallback when socket is disconnected             |
| Receive messages instantly (Socket.io) | Done   | `message:new` event via `useSocket` hook                                      |
| View previous messages after refresh   | Done   | `GET /api/messages` on page load; messages stored in MongoDB                  |
| Display message timestamps             | Done   | `toLocaleTimeString()` on each message bubble                                 |
| Clean, user-friendly UI                | Done   | Responsive chat layout with header, message list, typing indicator, and input |


**Frontend structure:**

```
frontend/src/
├── App.jsx
├── main.jsx
├── App.css
├── api/messages.js
├── hooks/useSocket.js
├── utils/guestId.js
└── components/
    ├── ChatWindow.jsx
    ├── LoginScreen.jsx
    ├── MessageInput.jsx
    ├── MessageList.jsx
    ├── OnlineUsers.jsx
    ├── TypingIndicator.jsx
    ├── UserMenu.jsx
    ├── ThemeToggle.jsx
    └── EmojiPicker.jsx
```

**Utility modules:**

```
frontend/src/utils/
├── guestId.js      # Login identity, rename, logout
├── dateLabel.js    # Today / Yesterday date labels
└── hooks/
    ├── useSocket.js
    └── useTheme.js # Dark mode persistence
```

---

## 2. Backend

**Technology:** Node.js + Express + Socket.io

### REST APIs


| Method | Endpoint        | Description                    | Status |
| ------ | --------------- | ------------------------------ | ------ |
| `GET`  | `/api/messages` | Fetch chat history             | Done   |
| `POST` | `/api/messages` | Send a message (REST fallback) | Done   |
| `GET`  | `/api/health`   | Health check                   | Done   |


`**GET /api/messages`** — query params: `limit` (default 50), `before` (ISO date for pagination)

`**POST /api/messages**` — body: `{ text, senderId, senderName }`

### Real-Time Communication (Mandatory)

Socket.io is the primary messaging layer. Polling, Firebase, and other alternatives are **not** used.


| Requirement                                      | Status | Implementation                                  |
| ------------------------------------------------ | ------ | ----------------------------------------------- |
| Deliver messages instantly without page refresh  | Done   | `message:send` → `message:new` broadcast        |
| Broadcast new messages to all connected users    | Done   | `io.emit('message:new', { message })`           |
| Handle connections and disconnections gracefully | Done   | `user:join` on connect; cleanup on `disconnect` |


**Socket.io events:**


| Direction       | Event               | Payload                          |
| --------------- | ------------------- | -------------------------------- |
| Client → Server | `user:join`         | `{ senderId, senderName }`       |
| Client → Server | `user:rename`       | `{ senderId, senderName }`       |
| Client → Server | `message:send`      | `{ text, senderId, senderName }` |
| Client → Server | `typing:start`      | `{ senderId, senderName }`       |
| Client → Server | `typing:stop`       | `{ senderId }`                   |
| Client → Server | `message:read`      | `{ messageId, senderId }`        |
| Server → Client | `message:new`       | `{ message }`                    |
| Server → Client | `message:delivered` | `{ messageId, deliveredTo }`     |
| Server → Client | `message:read`      | `{ messageId, readBy }`          |
| Server → Client | `typing:update`     | `{ typingUsers }`                |
| Server → Client | `users:online`      | `{ users }`                      |
| Server → Client | `error`             | `{ message }`                    |


**Backend structure:**

```
backend/src/
├── index.js
├── config/db.js
├── models/Message.js
├── routes/messages.js
├── controllers/messageController.js
├── services/messageService.js
├── socket/index.js
└── middleware/errorHandler.js
```

---

## 3. Code Quality


| Requirement                            | Status | Notes                                                                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Meaningful folder organization         | Done   | Separate `frontend/` and `backend/` with layered backend (`routes` → `controllers` → `services` → `models`) |
| Clean architecture and reusable code   | Done   | `useSocket` hook, API module, service layer, shared validation                                              |
| Graceful API and Socket error handling | Done   | `errorHandler` middleware, socket `error` events, frontend error banner                                     |
| Clean, readable, maintainable code     | Done   | Small focused components, consistent naming, minimal coupling                                               |


---

## 4. README

### Project Setup Instructions

**Prerequisites:**

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)

**Clone and configure environment files:**

```bash
git clone <your-repo-url>
cd ChatApplication

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Start MongoDB (macOS Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

Or set `MONGODB_URI` in `backend/.env` to a MongoDB Atlas connection string.

### Steps to Run the Backend

```bash
cd backend
npm install
npm run dev
```

Server starts at **[http://localhost:5001](http://localhost:5001)**.

Expected output:

```
MongoDB connected
Server running on http://localhost:5001
```

### Steps to Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

App opens at **[http://localhost:5173](http://localhost:5173)**.

### Test Real-Time Chat

1. Open **[http://localhost:5173](http://localhost:5173)** in two browser tabs
2. Enter a friendly name on the login screen in each tab
3. Send a message in one tab — it appears instantly in the other
4. Refresh either tab — previous messages remain visible with timestamps

### Environment Variables Required

**Backend (`backend/.env`):**


| Variable      | Required | Default                 | Description               |
| ------------- | -------- | ----------------------- | ------------------------- |
| `PORT`        | No       | `5001`                  | Server port               |
| `MONGODB_URI` | Yes      | —                       | MongoDB connection string |
| `CLIENT_URL`  | No       | `http://localhost:5173` | Primary CORS origin       |


**Frontend (`frontend/.env`):**


| Variable          | Required | Default                 | Description          |
| ----------------- | -------- | ----------------------- | -------------------- |
| `VITE_API_URL`    | No       | `http://localhost:5001` | Backend REST API URL |
| `VITE_SOCKET_URL` | No       | `http://localhost:5001` | Socket.io server URL |


### Design Decisions

1. **REST + Socket.io dual path** — REST loads chat history on mount and serves as a send fallback when the socket is disconnected. Socket.io is the primary real-time delivery path.
2. **Username-based login (dummy auth)** — Users enter a friendly display name on a login screen. A UUID `senderId` is generated and stored in `localStorage`. Users can rename or logout without a password or server-side auth.
3. **Single global chat room** — All connected users share one room. No channels or direct messages.
4. **In-memory presence, persisted messages** — Online user list and typing state live in server memory (reset on server restart). Messages are stored in MongoDB and survive page refresh and server restart.
5. **Read/delivered receipts** — `deliveredTo` tracks users who received the message via socket broadcast. `readBy` tracks users who scrolled the message into view.
6. **Flexible localhost CORS** — Backend accepts any `http://localhost:<port>` origin in development so Vite port changes do not break the socket connection.

### Assumptions

- Single shared chat room for all users
- Dummy authentication only (display name + local UUID; no passwords or JWT)
- Local development URLs (`localhost:5001`, `localhost:5173`)
- MongoDB must be running before starting the backend
- One user identity per browser (stored in `localStorage`)
- Plain text messages only (no file uploads or rich media)
- React web app is used instead of React Native; screen recording is provided instead of an APK

---

## Bonus (Optional)

Features listed in the original problem statement:


| Bonus Feature                               | Status                                        |
| ------------------------------------------- | --------------------------------------------- |
| Username-based login (dummy authentication) | Done — `LoginScreen` with friendly name entry |
| Typing indicator                            | Done                                          |
| Online/offline user status                  | Done                                          |
| Message read/delivered status               | Done                                          |
| Store messages in MongoDB                   | Done                                          |
| Deploy backend (Render, Railway, etc.)      | Done (Render)                                     |


---

## Additional Features Added (Beyond Original Requirements)

Extra user-friendly and polish features implemented on top of the base requirements:


| Feature                          | Status | Description                                                   |
| -------------------------------- | ------ | ------------------------------------------------------------- |
| Friendly name login screen       | Done   | Users pick a display name before joining chat                 |
| Rename user                      | Done   | Change display name anytime from the header                   |
| Logout                           | Done   | Clear session and return to login screen                      |
| Date labels on messages          | Done   | Shows **Today**, **Yesterday**, or full date dividers in chat |
| Emoji picker                     | Done   | Insert emojis into messages from a built-in picker            |
| Dark mode                        | Done   | Toggle light/dark theme; preference saved in `localStorage`   |
| Connection status indicator      | Done   | Shows **Connected** / **Reconnecting...** in the header       |
| Error banners                    | Done   | Displays API and socket errors to the user                    |
| REST send fallback               | Done   | Messages still send via REST if socket is temporarily down    |
| User rename sync (`user:rename`) | Done   | Renamed users update in the online list in real time          |
| Flexible localhost CORS          | Done   | Backend accepts any `localhost` port during development       |
| Message pagination API           | Done   | `GET /api/messages?before=<date>&limit=50` (backend ready)    |
| Responsive mobile layout         | Done   | Full-screen layout on small screens                           |
| Persistent guest identity        | Done   | Same user returns automatically via `localStorage`            |
| Name validation                  | Done   | 2–20 characters; letters, numbers, spaces, dots, hyphens      |


**Not yet added:**


| Feature                                    | Status                                   |
| ------------------------------------------ | ---------------------------------------- |
| Load older messages UI (pagination button) | Not done — API supports it, UI not wired |
| Sound notifications                        | Not done                                 |
| Multiple chat rooms                        | Not done                                 |


---
## Live Deployment

### GitHub Repository
https://github.com/priyanshu1125-stack/vedaz_chat_application_priyanshu

### Backend API (Render)
https://vedaz-chat-application-priyanshu.onrender.com  |


## Submission

| Deliverable | Status |
|-------------|--------|
| GitHub Repository | Completed — https://github.com/priyanshu1125-stack/vedaz_chat_application_priyanshu |
| Live Backend (Render) | https://vedaz-chat-application-priyanshu.onrender.com |
| APK file | N/A — React Web App (not React Native) |
| Screen recording of the application | Completed |
| Google Drive link (Screen Recording) | https://drive.google.com/file/d/1pE2oKXR9Hdwg8HS5SFd7nTvnRZw-mMhn/view?usp=drivesdk |
| README with setup instructions | Completed |

## Architecture

```
┌─────────────┐     REST (history, fallback send)     ┌──────────────┐
│  React App  │◄─────────────────────────────────────►│   Express    │
│             │     Socket.io (real-time messaging)   │  + Socket.io │
└─────────────┘◄─────────────────────────────────────►└──────┬───────┘
                                                             │
                                                             ▼
                                                        ┌──────────┐
                                                        │ MongoDB  │
                                                        └──────────┘
```

---

## Troubleshooting


| Issue                                    | Solution                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `MongoServerError: connect ECONNREFUSED` | Start MongoDB or fix `MONGODB_URI`                                     |
| CORS errors in browser                   | Ensure `CLIENT_URL` in `backend/.env` matches the frontend URL         |
| Socket shows "Reconnecting..."           | Confirm backend is running and `VITE_SOCKET_URL` points to port `5001` |
| Messages not appearing in real time      | Check browser console for socket errors; hard refresh the page         |
| `EADDRINUSE` on port 5000 (macOS)        | Use `PORT=5001` in `backend/.env` (macOS AirPlay uses port 5000)       |
| Frontend starts on a different port      | Backend accepts any `localhost` port; open the URL shown by Vite       |


# vedaz_chat_application_priyanshu
