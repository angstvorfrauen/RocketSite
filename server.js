//==========================\\
const {
  generateWAMessageFromContent,
  getAggregateVotesInPollMessage,
  downloadContentFromMessage,
  useMultiFileAuthState,
  generateWAMessage,
  makeInMemoryStore,
  DisconnectReason,
  areJidsSameUser,
  decryptPollVote,
  getContentType,
  makeWASocket,
  relayMessage,
  jidDecode,
  Browsers,
  proto,
  store
} = require("@angstvorfrauen/baileys");
//==========================\\
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const pino = require("pino");
const fs = require("fs");
//==========================\\
const app = express();
const port = 8000;
const sessionsPath = path.join(__dirname, "Sessions");
const USERS_FILE = path.join(__dirname, "users.json");
const EXPIRED_FILE = path.join(__dirname, "expiredUsers.json");
const EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;
//==========================\\
app.use(express.static(path.join(__dirname, "Files")));
app.use(bodyParser.json());
//==========================\\
let activeSessions = new Map();
//==========================\\
const startSessions = async () => {
  const sessionFolders = fs
    .readdirSync(sessionsPath)
    .filter((folder) => {
      const fullPath = path.join(sessionsPath, folder);
      return fs.statSync(fullPath).isDirectory();
    });
  for (const folder of sessionFolders) {
    const store = makeInMemoryStore({
      logger: pino().child({
        level: "silent",
        stream: "store",
      }),
    });
    const sessionId = folder;
    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(sessionsPath, sessionId)
    );
    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
    });
    sock.ev.on("connection.update", (update) => {
      const { connection } = update;
      if (connection === "open") {
        activeSessions.set(sessionId, sock);
      } else if (connection === "close") {
        activeSessions.delete(sessionId);
      }
    });
    sock.ev.on("creds.update", saveCreds);
  }
};
//==========================\\
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Files", "index.html"));
});
//==========================\\
function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    pad(date.getDate()) +
    "." +
    pad(date.getMonth() + 1) +
    "." +
    date.getFullYear() +
    "/" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}
//==========================\\
const loadUsers = () => {
  if (fs.existsSync(USERS_FILE)) {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  }
  return [];
};
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};
const loadExpiredUsers = () => {
  if (fs.existsSync(EXPIRED_FILE)) {
    return JSON.parse(fs.readFileSync(EXPIRED_FILE, "utf8"));
  }
  return [];
};
const saveExpiredUsers = (users) => {
  fs.writeFileSync(EXPIRED_FILE, JSON.stringify(users, null, 2));
};
//==========================\\
const expireUser = (username) => {
  let users = loadUsers();
  let expiredUsers = loadExpiredUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return;
  const [expiredUser] = users.splice(index, 1);
  expiredUser.expiredAt = formatDate(new Date());
  expiredUsers.push(expiredUser);
  saveUsers(users);
  saveExpiredUsers(expiredUsers);
};
//==========================\\
const checkExpiredUsers = () => {
  let users = loadUsers();
  const now = new Date();
  const stillActive = [];
  const expiredUsers = loadExpiredUsers();
  users.forEach(user => {
    const [datePart, timePart] = user.expireIn.split("/");
    const [day, month, year] = datePart.split(".").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    const expireDate = new Date(year, month - 1, day, hour, minute, second);
    if (now >= expireDate) {
      user.expiredAt = formatDate(now);
      expiredUsers.push(user);
      console.log(`User '${user.username}' expired and moved.`);
    } else {
      stillActive.push(user);
    }
  });
  if (expiredUsers.length > 0) {
    saveExpiredUsers(expiredUsers);
    saveUsers(stillActive);
  }
};
setInterval(checkExpiredUsers, 1000);
//==========================\\
app.post("/crash-android", async (req, res) => {
  let { number } = req.body;
  number = number.replace(/[^0-9]/g, "");
  let sentCount = 0;
  for (const [_, sock] of activeSessions.entries()) {
    const from = number + "@s.whatsapp.net";
    await sock.sendMessage(from, { text: "Android" });
    sentCount++;
  }
  res.json({ sent: sentCount });
});
//==========================\\
app.post("/crash-ios", async (req, res) => {
  let { number } = req.body;
  number = number.replace(/[^0-9]/g, "");
  let sentCount = 0;
  for (const [_, sock] of activeSessions.entries()) {
    const from = number + "@s.whatsapp.net";
    await sock.sendMessage(from, { text: "ios" });
    sentCount++;
  }
  res.json({ sent: sentCount });
});
//==========================\\
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  let users = loadUsers();
  let expiredUsers = loadExpiredUsers();
  if (users.find(u => u.username === username) || expiredUsers.find(u => u.username === username)) {
    return res.status(409).json({ message: "User already exists." });
  }
  const now = new Date();
  const expireDate = new Date(now.getTime() + EXPIRATION_MS);
  const newUser = {
    username,
    password,
    createdAt: formatDate(now),
    expireIn: formatDate(expireDate),
  };
  users.push(newUser);
  saveUsers(users);
  res.json({ message: "Registration successful! Free 30 Day Trial has Started" });
});
//==========================\\
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  const users = loadUsers();
  const expiredUsers = loadExpiredUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    return res.json({ message: "Login successful!", username: user.username, expireIn: user.expireIn });
  }
  if (expiredUsers.find(u => u.username === username)) {
    return res.status(403).json({ message: "Buy new subscription." });
  }
  return res.status(401).json({ message: "Invalid username or password." });
});
//==========================\\
app.get("/api/users/count", (req, res) => {
  const users = loadUsers();
  res.json({ count: users.length });
});
//==========================\\
app.get("/online-sessions", (req, res) => {
  res.json({
    online: activeSessions.size,
    sessions: Array.from(activeSessions.keys()),
  });
});
//==========================\\
app.listen(port, () => {
  console.log(port);
  startSessions();
});
//==========================\\