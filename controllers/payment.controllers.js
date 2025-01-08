const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const createPayment = async (req, res) => {
  try {
    const body = {
      items: [
        {
          title: req.body.title,
          quantity: Number(req.body.quantity),
          unit_price: Number(req.body.unit_price),
        },
      ],
      notification_url: "https://7ba1-190-192-67-159.ngrok-free.app/webhook",
    };

    const preference = new Preference(client);

    const response = await preference.create({ body });
    console.log(response);

    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear la preferencia");
  }
};

module.exports = { createPayment };
