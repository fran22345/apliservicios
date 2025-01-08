const express = require("express");
const cors = require("cors");
const { sequelize, User, Message, Score } = require("./models");
require("dotenv").config();
const {createPayment} = require("./controllers/payment.controllers");

const app = express();
app.use(express.json());
app.use(cors());



app.post("/api/store-token", async (req, res) => {
  const { userId, token } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (user) {
      user.expoPushToken = token;
      await user.save();
    } else {
      await User.create({ id: userId, expoPushToken: token });
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error storing token");
  }
});

app.post("/notification", async (req, res) => {
  const { userId, title, body, data } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user || !user.expoPushToken) {
      return res.status(404).send("User not found or token not available");
    }
    user.notifications = body;
    await user.save();

    const message = {
      to: user.expoPushToken,
      sound: "default",
      title: title,
      body: body,
      data: data,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending notification");
  }
});

app.post("/crear-preferencia", createPayment);

app.post("/webhook", async (req, res) => {
  console.log(req.body);
  res.sendStatus(200);
});

app.get("/users", async (req, res) => {
  const users = await User.findAll({
    include: [
      { model: Message, as: "messages" },
      { model: Score, as: "scores" },
    ],
  });
  res.json(users);
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const person = await User.findOne({
      where: { id },
      include: [
        { model: Message, as: "messages" },
        { model: Score, as: "scores" },
      ],
    });
    res.json(person);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching person." });
  }
});

app.post("/users", async (req, res) => {
  const { nombre, apellido, profesion, linkFoto, description, price } =
    req.body;
  const user = await User.create({
    nombre,
    apellido,
    profesion,
    linkFoto,
    description,
    price,
  });
  res.json(user);
});

app.get("/messages", async (req, res) => {
  const messages = await Message.findAll({
    include: [{ model: User, as: "user" }],
  });
  res.json(messages);
});

app.post("/messages", async (req, res) => {
  const { userId, content } = req.body;
  const message = await Message.create({ userId, content });
  res.json(message);
});

app.get("/scores", async (req, res) => {
  const scores = await Score.findAll({
    include: [{ model: User, as: "user" }],
  });
  console.log(scores);

  res.json(scores);
});

app.get("/scores/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const averageScore = await Score.findOne({
      where: { userId },
      attributes: [[sequelize.fn("AVG", sequelize.col("value")), "Score"]],
    });
    res.json(averageScore);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the average score." });
  }
});

app.post("/scores", async (req, res) => {
  const { userId, value } = req.body;
  const score = await Score.create({ userId, value });
  res.json(score);
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
