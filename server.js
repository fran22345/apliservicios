const express = require("express");
const cors = require("cors");
const axios = require("axios")
const { sequelize, User, Message, Score, Pay, Services } = require("./models");
require("dotenv").config();
const { createPayment } = require("./controllers/payment.controllers");
const { notification } = require("./controllers/notification")
const { v4: uuidv4 } = require("uuid");
const morgan = require("morgan");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.post("/notification", notification);

app.post("/crear-preferencia", createPayment);

app.post("/webhook", async (req, res) => {

  const { type } = req.query;
  const dataId = req.query["data.id"] || req.body?.data?.id;

  if (!type || !dataId) {
    console.log("Webhook sin tipo o data.id");
    return res.sendStatus(200);
  }

  try {
    if (type === "payment") {

      axios
        .post("http://localhost:3000/notification",
          {
            "userId": "49f8dd2d-41b5-48b7-adea-ccf23599b24a",
            "title": "tienes un cliente"
            , "body": "hecho"
            , "data": "algo"
          })

      const payment = await new Payment(client).get({ id: dataId });
      console.log("Pago obtenido:", payment);

    } else {
      console.log("Tipo de webhook no manejado:", type);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en el webhook:", error.message);
    res.status(500).json({ error: error.message });
  }
});



app.post("/guardar-preferencia", async (req, res) => {
  //pay
  const { idBuyer, userId, title, quantity, unit_price, external_reference } =
    req.body;

  try {
    await Pay.create({
      userId,
      idBuyer,
      title,
      quantity,
      unit_price,
      status: "pending",
      external_reference,
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al guardar la preferencia");
  }
});


app.get("/services/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const person = await Services.findOne({
      where: { userId },
      include: {
        model: User,
        as: "User",
        include: [
          { model: Message, as: "messages" },
          { model: Score, as: "scores" }
        ]
      },
    });
    res.json(person);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching person." });
  }
});

app.get("/services", async (req, res) => {
  const users = await Services.findAll({
    include: [{
      model: User,
      as: "User",
      attributes: ["id"]
    }]
  });
  res.json(users);
});

app.post("/services", async (req, res) => {
  const { nombre, apellido, profesion, linkFoto, description, price, userId, googleId } =
    req.body;
  const user = await Services.create({
    userId,
    googleId,
    nombre,
    apellido,
    profesion,
    linkFoto,
    description,
    price,
  });
  res.json(user);
});

app.post("/users", async (req, res) => {
  const { nombre, apellido, linkFoto, expoPushToken, email, googleId } =
    req.body;
  const user = await User.create({
    id: uuidv4(),
    nombre,
    apellido,
    linkFoto,
    expoPushToken,
    email,
    googleId,
  });
  res.json(user);
});

app.get("/users/:googleId", async (req, res) => {
  const { googleId } = req.params;
  try {
    const person = await User.findOne({
      where: { googleId },
    });
    res.json(person);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching person." });
  }
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
