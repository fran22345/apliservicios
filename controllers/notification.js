const { Expo } = require("expo-server-sdk");
const { User, Notification } = require("../models");

const expo = new Expo();

const notification = async (req, res) => {
  const { userId, title, body, data } = req.body;

  try {

    const user = await User.findByPk(userId);

    if (!user || !user.expoPushToken) {
      return res.status(404).send("User not found or token not available");
    }

    console.log("Sending notification to token:", user.expoPushToken);

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.error("Invalid Expo push token:", user.expoPushToken);
      return res.status(400).send("Invalid Expo push token");
    }

    const message = {
      to: user.expoPushToken,
      sound: "default",
      title,
      body,
      data: typeof data === "object" ? data : { value: data },
    };

    const chunks = expo.chunkPushNotifications([message]);

    let tickets = [];

    for (let chunk of chunks) {

      try {

        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

        console.log("Expo ticket response:");
        console.log(JSON.stringify(ticketChunk, null, 2));

        tickets.push(...ticketChunk);

      } catch (err) {

        console.error("Error sending notification:", err);

      }
    }

    // Guardar notificación en DB
    await Notification.create({ title, body, data, userId });

    // ---- CHECK RECEIPTS ----

    const receiptIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    if (receiptIds.length > 0) {

      const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

      for (let chunk of receiptChunks) {

        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        console.log("Expo receipts response:");
        console.log(JSON.stringify(receipts, null, 2));

      }
    }

    res.status(200).json({
      message: "Notification processed",
      tickets
    });

  } catch (error) {

    console.error("Notification error:", error);

    res.status(500).send("Error sending notification");
  }
};

module.exports = { notification };