const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./model/user");
const bcrypt = require("bcrypt");

mongoose.connect("mongodb://localhost:27017/login-app-db");

const app = express();

app.use("/", express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());

app.post("/api/register", async (req, res) => {
  console.log(req.body);

  const { username, password: plainTextPassword } = req.body;

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      password,
    });
    console.log("User created successfully: ", response);
  } catch (error) {
    console.error("User creation error:", error); // Log specific error
    return res.json({ status: "err", error: error.message });
  }

  res.json({ status: "ok" });
});

app.listen(9999, () => {
  console.log("Server up at 9999");
});
