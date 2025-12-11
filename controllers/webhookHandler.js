const { Pay } = require("../models");
const axios = require ('axios')

async function webhookHandler(req, res) {
  const { type } = req.query;
  const dataId = req.query["data.id"] || req.body?.data?.id;

  if (!type || !dataId) {
    console.log("Webhook sin tipo o data.id");
    return res.sendStatus(200);
  }

  try {
    if (type === "payment") {
      // En producción: obtener pago real desde MP
      // const { externa_reference } = await new Payment(client).get({ id: dataId });

      const external_reference = "f5d1f21f-df22-4612-9335-d49b4b3b6d4d"; //esto esta harkodeado cambiar para que reciba de MP
      const response = await Pay.findOne({ where: { external_reference } });

      console.log("Respuesta de la base de datos:", response);

      await Promise.all([
        axios.post(`${process.env.LOCAL_HOST}/notification`, {
          userId: response.dataValues.userId,
          title: "Tienes un cliente",
          body: "Un usuario solicitó tu servicio",
          data: { evento: "cliente_nuevo",
            route:"/views/serviciosActivos"
           },
        }),

        axios.post(`${process.env.LOCAL_HOST}/notification`, {
          userId: response.dataValues.userId, // cambiar en produccion por idBuyer ahora no se puede
          title: "Ya avisamos al prestador",
          body: "El profesional fue notificado",
          data: { evento: "prestador_notificado"
            , route:"serviciosContratados"
           },
        }),
      ]);
    } else {
      console.log("Tipo de webhook no manejado:", type);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en el webhook:", error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {webhookHandler};
