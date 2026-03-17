const express = require("express");
const cors = require("cors");
const { sequelize, User, Message, Score, Services, Notification, Pay, Availability } = require("./models");
const { webhookHandler } = require("./controllers/webhookHandler");
require("dotenv").config();
const { createPayment } = require("./controllers/payment.controllers");
const { serciciosActivos, serciciosActivosBuyer } = require("./controllers/serviciosActivos")
const { notification } = require("./controllers/notification")
const { scores } = require("./controllers/controller.scores")
const { v4: uuidv4 } = require("uuid");
const morgan = require("morgan");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const axios = require("axios");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.disable("etag");


app.post("/notification", notification);
app.post("/crear-preferencia", createPayment);
app.post("/webhook", webhookHandler);
app.get("/serviciosActivos", serciciosActivos)
app.get("/serviciosActivosBuyer", serciciosActivosBuyer)

app.post("/guardar-preferencia", async (req, res) => {

  const { idBuyer, userId, quantity, description, unit_price, external_reference } =
    req.body;

  try {
    await Pay.create({
      userId,
      idBuyer,
      quantity,
      description,
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


app.get("/services/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Services.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "User",
          include: [
            { model: Message, as: "messages" },
            { model: Services, as: "services" },
            { model: Score, as: "scoresReceived" },
            { model: Score, as: "scoresGiven" },
          ],
        },
      ],
    });

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching service." });
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

  const person = await User.findOne({
    where: { googleId },
  })
  try {
    if (!person) {
      const user = await User.create({
        id: uuidv4(),
        nombre,
        apellido,
        linkFoto,
        expoPushToken,
        email,
        googleId,
      });
      res.status(201).json(user);
    } else {
      res.status(200).json({ responce: "ya existe el usuario" })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }


});

app.get("/servicioActivoUser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Pay.findOne({
      where: { id },
    })
    res.json(service)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurrd while fetching service" })
  }
})

app.get("/servicioActivoBuyer/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Pay.findOne({
      where: { id },
    })
    res.json(service)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurrd while fetching service" })
  }
})

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

app.get("/users/id/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const person = await User.findOne({
      where: { id: userId },
    });
    res.json(person);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching person." });
  }
});

app.get("/users/buyerid/:buyerid", async (req, res) => {
  const { buyerid } = req.params;
  try {
    const person = await User.findOne({
      where: { id: buyerid },
    });
    res.json(person);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching person." });
  }
});

app.put("/servicioConcluido", async (req, res) => {
  const { servId, buyerId } = req.body
  try {

    await Promise.all([
      Pay.update({ status: "finalized" }, { where: { id: servId } }),

      axios.post(`${process.env.LOCAL_HOST}/notification`, {
        userId: buyerId,
        title: "Servicio concluido",
        body: "La persona ha concluido su tarea",
        data: {
          evento: "servicio_terminado",
          route: "/views/homeScreen"
        },
      }),
    ]);

    res.status(200).json({ message: "Cambiado a Finalizado" })
  } catch (error) {
    res.status(500).json({ error: "error al actualizar" })
  }
})

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


app.get("/scores/:googleId", async (req, res) => {
  const { googleId } = req.params;

  try {
    const result = await Score.findOne({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("value")), "value"],
      ],
      include: [
        {
          model: User,
          as: "seller",
          where: { googleId },
          attributes: [],
        },
      ],
      raw: true,
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error getting average score" });
  }
});


app.post("/scores", scores);


app.get("/notifRequest", async (req, res) => {
  try {
    const { googleId } = req.query;

    if (!googleId) {
      return res.status(400).json({ error: "googleId is required" });
    }

    const user = await User.findOne({
      where: { googleId },
      include: [
        {
          model: Notification,
          as: "notifications",
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user.notifications || []);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ error: error.message });
  }
});


app.post("/notifErase", async (req, res) => {
  try {
    const { id } = req.body;


    const eraseNotif = await Notification.destroy({
      where: { id },
    });

    if (eraseNotif === 0) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.json({ message: "Notificación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la notificación:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.get("/score/check", async (req, res) => {
  const { buyerId, payId } = req.query;

  if (!buyerId || !payId) {
    return res.status(400).json({ error: "Faltan parámetros buyerId o payId" });
  }

  try {
    const score = await Score.findOne({ where: { buyerId, payId } });
    res.json(score || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al buscar calificación" });
  }
});

app.post("/availability/request", async (req, res) => {
  const { providerId, buyerId, serviceId } = req.body;

  try {
    const request = await Availability.create({
      providerId,
      buyerId,
      serviceId,
      status: "pending",
    });

    await axios.post(`${process.env.LOCAL_HOST}/notification`, {
      userId: providerId,
      title: "Consulta de disponibilidad",
      body: "Un usuario quiere saber si estás disponible para un servicio.",
      data: {
        route: "/views/serviciosActivos",
        availabilityId: request.id
      }
    });

    res.json(request);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "No se pudo crear la consulta" });
  }
});

app.get("/availability/check", async (req, res) => {
  const { buyerId, providerId, serviceId } = req.query;

  const record = await Availability.findOne({
    where: { buyerId, providerId, serviceId },
    order: [["createdAt", "DESC"]]
  });

  res.json(record || {});
});

app.put("/availability/respond", async (req, res) => {
  const { availabilityId, response } = req.body;

  try {
    const record = await Availability.findOne({
      where: { id: availabilityId },
    });

    if (!record) return res.status(404).json({ error: "No encontrado" });

    record.status = response; // "accepted" o "rejected"
    await record.save();

    // notificación al comprador
    await axios.post(`${process.env.LOCAL_HOST}/notification`, {
      userId: record.buyerId,
      title: "Disponibilidad actualizada",
      body:
        response === "accepted"
          ? "El proveedor está disponible"
          : "El proveedor no está disponible",
      data: {
        route: "/details",
        availabilityId
      }
    });

    res.json(record);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error actualizando disponibilidad" });
  }
});

app.get("/availability/:id", async (req, res) => {
  try {
    const a = await Availability.findByPk(req.params.id);

    if (!a) return res.status(404).json({ error: "Availability no encontrado" });
    res.json(a);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error actualizando availability" });
  }
}); app.put("/availability/response/:id", async (req, res) => {
  const { status } = req.body;

  try {
    const a = await Availability.findByPk(req.params.id);

    if (!a) return res.status(404).json({ error: "Availability no encontrado" });

    a.status = status;
    await a.save();

    res.json(a);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error actualizando availability" });
  }
});


app.get("/availability", async (req, res) => {
  const { userId } = req.query;

  try {
    const list = await Availability.findAll({
      where: { providerId: userId },
      order: [["createdAt", "DESC"]],
    });

    res.json(list);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error obteniendo disponibilidad" });
  }
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
