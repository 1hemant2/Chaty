# 🚀 chaty – Real-time Chat Engine

A blazing-fast real-time messaging backend built with **Node.js**, **Socket.IO**, **Redis**, and **MongoDB**.

> Forked from an open-source REST boilerplate and transformed into a **WebSocket-native** event-driven system. Built to handle 1-on-1 chats, user presence, message sync, and delivery status — no REST API surface.

---

## 🧠 What is chaty?

**chaty** is a real-time, event-driven messaging backend designed for 1-on-1 communication. Powered by WebSockets and Redis pub/sub, it delivers:

- ⚡ Instant message delivery
- 🟢 Real-time presence updates
- 🔁 Offline message syncing
- 📬 Delivery and seen status tracking
- 🧠 Scalable multi-node architecture

It began as a fork of `node-express-boilerplate` but evolved into a completely socket-based engine tailored for chat apps.

---

## 🔧 Tech Stack

- **Node.js + Express** – Core backend runtime
- **Socket.IO** – WebSocket-based event system
- **Redis + socket.io-redis-adapter** – Pub/Sub scaling across instances
- **MongoDB + Mongoose** – Persistent data storage (users, threads, messages)
- **JWT (WIP)** – Token-based authentication on socket handshake

---

## ⚙️ Implemented Features

### ✅ Core Functionality

- 🔒 User login + DB profile save
- 🟢 Online presence tracked via Redis
- 🧵 Thread creation on first message
- 📬 Delivery + seen message tracking
- 🔁 Reconnection sync for missed messages
- 🔔 Notification if recipient is online but not in thread
- ❌ Thread exit on disconnect or manual leave
- 👀 Last seen from Redis or fallback to Mongo
- 🔄 Redis-based socket clustering

---

## 💬 Socket Event APIs

| Event                      | Description                                               |
|---------------------------|-----------------------------------------------------------|
| `user_join`               | User becomes online and joins system                     |
| `join_thread`             | Join or initiate a 1-on-1 conversation thread             |
| `chat_message`            | Send message to another user                             |
| `message_ack`             | Acknowledge delivery of message                          |
| `message_status`          | Mark message as seen                                     |
| `remove_user_from_thread` | Exit a thread manually                                   |
| `reconnect_user`          | Pull missed messages and rejoin threads after reconnect  |
| `self_message_notification` | Handle same-user messaging edge case                   |
| `disconnect_user`         | Clean up threads and presence on disconnect              |
| `typing` (WIP)            | Real-time typing indicators                              |

---

## 🧠 Redis Adapter – How It Powers Scaling

The [socket.io-redis-adapter](https://socket.io/docs/v4/redis-adapter/) enables:

- 📡 Broadcasting events across multiple server nodes
- 🧠 Shared awareness of who’s online + which thread they’re in
- 🗃️ Redis as central hub for presence + pub/sub coordination

> Without Redis = single-node only. With Redis = plug-and-play horizontal scalability.

---

## 🧰 Developer Tools (WIP)

> Tools built to help debug and interact with the chat server in real-time

| Tool                          | Description                                       | Status |
|------------------------------|---------------------------------------------------|--------|
| `client.html`                | A single-file HTML + JS client for testing socket events manually | 🛠️ WIP |

This internal tool lets you:

- Connect to the WebSocket server with a token
- Emit and listen to custom socket events
- Simulate multiple users via different tabs or browser windows
- Debug payloads and thread behavior visually

> It’s not meant for production — just a utility for devs building or testing the backend in isolation.

---

## 🧪 Upcoming Features

> These features are either in progress or planned for future releases.

### 🔧 Work In Progress
- `typing` – Real-time typing indicators
- `JWT-auth` – Token-based socket handshake validation

### 🗓️ Planned / Backlog
- `group_threads` – Multi-user thread support
- `file_sharing` – Send images and documents via WebSocket
- `fetch-user-thread` – REST API to fetch a user’s threads
- `search-user` – REST API to search users by name or email
- `map-user-thread` – REST API to fetch threadId for a given userId pair

---

## ⚙️ Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd chaty
yarn install

cp .env.example .env
# Fill in MongoDB URI, Redis URL, etc.

docker run -p 6379:6379 redis

 
## 🙏 Credits & Acknowledgements

This project originally began as a fork of the fantastic open-source boilerplate:

- 🔗 [`node-express-boilerplate`](https://github.com/hagopj13/node-express-boilerplate)  
  by [Hagop Jamkojian](https://github.com/hagopj13)

Special thanks to Hagop for creating a solid, production-grade RESTful foundation that inspired this project’s architecture.

---

### ✨ Transformation into `chaty`

Over time, the project evolved far beyond its REST roots into a fully event-driven WebSocket engine — tailored for real-time messaging at scale.

- 👨‍💻 **Author**: [Hemant Kumar](https://github.com/1hemant2)
- 🛠️ Major Contributions:
  - Real-time Socket.IO architecture
  - Redis adapter integration for scaling
  - 1-on-1 thread and message system
  - Presence, delivery, and seen tracking
  - Offline sync and reconnect logic
  - DB + in-memory hybrid presence strategy

This project serves both as a **backend engineering showcase** and a **foundation for future chat apps**.

If you learned something or reused parts of this system, feel free to fork, remix, and build on it — just don’t forget to give credit. 🤝
