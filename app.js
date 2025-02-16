import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

let users = {};

// Socket Code
io.on("connection", function (socket) {
  console.log(`Connected ${socket.id}`);

  socket.on("join-user", function (username) {
    users[username] = { username, id: socket.id };
    io.emit("user-joined", users);
  });

  socket.on("offer", function ({ from, to, offer }) {
    if (users[to]) {
      io.to(users[to].id).emit("offer", { from, to, offer });
    }
  });

  socket.on("answer", function ({ from, to, answer }) {
    if (users[to]) {
      io.to(users[to].id).emit("answer", { from, to, answer });
    }
  });

  socket.on("icecandidate", function ({ to, candidate }) {
    if (users[to]) {
      io.to(users[to].id).emit("icecandidate", candidate);
    }
  });

  socket.on("disconnect", function () {
    for (const username in users) {
      if (users[username].id === socket.id) {
        delete users[username];
        break;
      }
    }
    io.emit("user-joined", users);
    console.log(`Disconnected ${socket.id}`);
  });
});

app.get("/", function (req, res) {
  res.render("index");
});

const port = 3000;
server.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
