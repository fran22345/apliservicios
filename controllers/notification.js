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

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      return res.status(400).send("Invalid Expo push token");
    }

    const message = {
      to: user.expoPushToken,
      sound: "default",
      title,
      body,
      data,
    };

    const chunks = expo.chunkPushNotifications([message]);

    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    await Notification.create({ title, body, data, userId });

    res.status(200).json({ message: "Notification sent" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending notification");
  }
};

module.exports = { notification };