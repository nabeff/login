const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "jkbkhbqonoijjo@ù^$ùgiojsouihqohcq";

mongoose.connect("mongodb://localhost:27017/login-app-db");

const app = express();

app.use("/", express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: "error", error: "Invalid username or password" });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET
    );
    res.header("Authorization", `Bearer ${token}`);
    return res.json({ status: "ok", data: token });
  }

  res.json({ status: "error", error: "Invalid username or password" });
});

app.post("/api/register", async (req, res) => {
  const { username, password: plainTextPassword } = req.body;

  if (!username || typeof username !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be at least 6 character",
    });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      password,
    });

    console.log("User created successfully: ", response);

    const token = jwt.sign(
      {
        id: response._id,
        username: response.username,
      },
      JWT_SECRET
    );

    res.json({ status: "ok", data: { token, username } }); // Send token and username
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
});

app.get("/api/profile", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.json({ status: "error", error: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.json({ status: "error", error: "User not found" });
    }

    // Return the user's data
    res.json({ status: "ok", user: { username: user.username } });
  } catch (error) {
    return res.json({ status: "error", error: "Invalid token" });
  }
});

app.listen(9999, () => {
  console.log("Server up at 9999");
});
