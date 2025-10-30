const webhook = async (req, res) => {
  const { id } = req.body;

  console.log("Webhook received", id);

  res.sendStatus(200);
};

module.exports = { webhook };
