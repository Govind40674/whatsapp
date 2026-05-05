import dotenv from "dotenv";
dotenv.config();

import express from "express";

import http from "http";
import cors from "cors";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import upload from "./middlewares/upload.js";

// 🔹 DB Connection
import connectDB from "./config/db_config.js";
connectDB();

import User from "./Schema/user.js";
import Message from "./Schema/message.js";

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "https://looptalk-gfr8.onrender.com"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});



app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://looptalk-gfr8.onrender.com",
      "http://192.168.29.203:5174", // <-- replace this
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   🔥 SOCKET.IO LOGIC
========================= */
io.on("connection", (socket) => {
  console.log("🔥 Connected:", socket.id);

  /* =========================
     JOIN ROOM
  ========================= */
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
  });

  /* =========================
     CALL SYSTEM
  ========================= */
  socket.on("call-user", ({ offer, roomId, type }) => {
    socket.to(roomId).emit("incoming-call", { offer, type });
  });

  socket.on("answer-call", ({ answer, roomId }) => {
    socket.to(roomId).emit("call-accepted", { answer });
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  /* =========================
     🔁 RENEGOTIATION
  ========================= */
  socket.on("renegotiate", ({ offer, roomId }) => {
    socket.to(roomId).emit("renegotiate", { offer });
  });

  socket.on("renegotiate-answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("renegotiate-answer", { answer });
  });

  /* =========================
     🔁 REJOIN AFTER REFRESH (KEY FIX)
  ========================= */
  socket.on("rejoin-call", ({ roomId }) => {
    console.log("♻️ User rejoined:", roomId);

    socket.join(roomId);
    socket.roomId = roomId;

    // 🔥 Tell other user to recreate offer
    socket.to(roomId).emit("user-rejoined");
  });

  /* =========================
     END CALL
  ========================= */
  socket.on("end-call", ({ roomId }) => {
    socket.to(roomId).emit("end-call");
  });

  /* =========================
     🔥 SMART DISCONNECT (FIXED)
  ========================= */
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    const roomId = socket.roomId;
    if (!roomId) return;

    // wait to check if it's refresh or actual leave
    setTimeout(() => {
      const room = io.sockets.adapter.rooms.get(roomId);

      // ❌ No room → nothing to do
      if (!room) return;

      // 🔥 If only one user remains → real disconnect
      if (room.size === 1) {
        console.log("📴 Real disconnect → ending call");
        socket.to(roomId).emit("end-call");
      }

      // 🔁 If 2 users again → refresh happened → do nothing
    }, 2000); // 2 sec delay is enough
  });
  socket.on("user_online",  (email) => {
    
    socket.broadcast.emit("onlineusers",email);

  });

  socket.on("user_offline", (email) => {
    socket.broadcast.emit("offlineusers",email);
  });


});
/* =========================
   🔹 FETCH MESSAGES
========================= */

app.post("/messages", async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    const roomId = [sender, receiver].sort().join("_");

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

/* =========================
   🔹 NODEMAILER
========================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

/* =========================
   🔹 OTP STORE
========================= */

const otpStore = {};

/* =========================
   🔹 SEND OTP
========================= */

app.post("/otp-send", async (req, res) => {
  const { email } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Code",
      text: `Your OTP code is ${otp}`,
    });

    res.cookie("email", email, {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "OTP failed" });
  }
});

/* =========================
   🔹 REGISTER
========================= */

app.post("/register", async (req, res) => {
  const { password, otp, email } = req.body;
  // const email = req.cookies.email;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" });
    }

    const storedOtp = otpStore[email];
    console.log("Stored OTP:", storedOtp, "Provided OTP:", otp);

    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    delete otpStore[email];
    res.clearCookie("email");

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "2d" },
    );

    // res.json({ token });
    res.json({
      token,
      email: newUser.email, // ✅ add this
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   🔹 LOGIN
========================= */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid email" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // res.json({ token });
    res.json({
      token,
      email: user.email, // ✅ add this
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/friend-requests", async (req, res) => {
  const { email, ownemail } = req.body;

  try {
    if (!email || !ownemail) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (email === ownemail) {
      return res.status(400).json({ message: "Cannot add yourself" });
    }

    // ✅ FIX: check inside object array
    const alreadyFriend = await User.findOne({
      email: ownemail,
      "email_friends.email": email,
    });

    if (alreadyFriend) {
      return res.json({ message: "already friend" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.json({
      email: user.email,
      name: user.name,
      image: user.image,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/send-friend-request", async (req, res) => {
  const { email, ownemail } = req.body;

  try {
    // already sent?
    const alreadySent = await User.findOne({
      email,
      requests: ownemail,
    });

    if (alreadySent) {
      return res.status(400).json({ message: "request already sent" });
    }

    // ✅ use $addToSet (no duplicates)
    await User.findOneAndUpdate(
      { email },
      { $addToSet: { requests: ownemail } },
    );

    await User.findOneAndUpdate(
      { email: ownemail },
      { $addToSet: { sent_requests: email } },
    );

    res.json({ message: "request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/friend-requests-lists", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    // ✅ return only emails
    res.json(user.requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/friend-requests/accept", async (req, res) => {
  const { email, requestemail } = req.body;

  try {
    const senderUser = await User.findOne({ email: requestemail });
    const receiverUser = await User.findOne({ email });

    if (!senderUser || !receiverUser) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ Add full object (NO MORE CastError)
    await User.findOneAndUpdate(
      { email },
      {
        $addToSet: {
          email_friends: {
            name: senderUser.name,
            email: senderUser.email,
            image: senderUser.image,
          },
        },
        $pull: { requests: requestemail },
      },
    );

    await User.findOneAndUpdate(
      { email: requestemail },
      {
        $addToSet: {
          email_friends: {
            name: receiverUser.name,
            email: receiverUser.email,
            image: receiverUser.image,
          },
        },
        $pull: { sent_requests: email },
      },
    );

    res.json({ message: "request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/friend-requests/reject", async (req, res) => {
  const { email, requestemail } = req.body;

  try {
    await User.findOneAndUpdate(
      { email },
      { $pull: { requests: requestemail } },
    );

    await User.findOneAndUpdate(
      { email: requestemail },
      { $pull: { sent_requests: email } },
    );

    res.json({ message: "request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/member", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    res.json(user.email_friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/users/search", async (req, res) => {
  const { email, ownemail } = req.body;

  try {
    // ✅ Find user first (only by ownemail)
    const user = await User.findOne({ email: ownemail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Filter friends (partial match)
    const filtered = user.email_friends.filter((u) => u.email.includes(email));

    // ✅ If no match
    if (filtered.length === 0) {
      return res.status(200).json({ message: "Not your friend", data: [] });
    }

    // ✅ Send matched friends
    return res.json({ data: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/profile", async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.put("/profile/update", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err.message);
      return res.status(500).json({ message: err.message });
    }

    try {
      console.log("BODY:", JSON.stringify(req.body, null, 2));
      console.log("FILE:", req.file);

      const { name, password, email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email missing" });
      }

      const updateData = {};

      if (name) updateData.name = name;

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      if (req.file) {
        updateData.image = req.file.path;
      }

      const updatedUser = await User.findOneAndUpdate(
        { email },
        { $set: updateData },
        { returnDocument: "after" },
      );

      await User.updateMany(
        { "email_friends.email": email },
        {
          $set: {
            "email_friends.$[elem].name": updatedUser.name,
            "email_friends.$[elem].image": updatedUser.image,
          },
        },
        {
          arrayFilters: [{ "elem.email": email }],
        },
      );

      res.json(updatedUser);
    } catch (err) {
      console.error("ROUTE ERROR:", err.message);
      res.status(500).json({ message: err.message });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
