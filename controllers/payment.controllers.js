const { MercadoPagoConfig, Preference } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const createPayment = async (req, res) => {
  try {
    const { idBuyer, userId, title, quantity, unit_price } =
      req.body;
    //const external_reference = uuidv4();

    const body = {
      items: [
        {
          idBuyer,
          userId,
          title,
          quantity,
          unit_price,
        },
      ],
      notification_url: "https://066e1233f5b7.ngrok-free.app/webhook",
      back_urls: {
        success: "apliservi://views/homeScreen",
        failure: "http://www.tu-sitio/failure",
        pending: "http://www.tu-sitio/pending",
      },
      auto_return: "approved",
      external_reference: uuidv4(),
    };

    const preference = new Preference(client);
    const response = await preference.create({ body });

    await fetch("http://localhost:3000/guardar-preferencia", {
      //pay
      //asocia el id del vendedor con el id del usuario
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idBuyer,
        userId,
        title,
        quantity,
        unit_price,
        external_reference: response.external_reference,
      }),
    });

    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear la preferencia");
  }
};

module.exports = { createPayment };
