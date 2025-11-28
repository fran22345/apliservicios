const { Expo } = require('expo-server-sdk');
const { User } = require('../models');
const { Notification } = require("../models");

let expo = new Expo();

const notification = async (req, res) => {
    const { userId, title, body, data } = req.body;

    try {
        const user = await User.findByPk(userId);
        

        if (!user || !user.expoPushToken) {
            return res.status(404).send("User not found or token not available");
        }

        user.notifications = body;
        await user.save();

        const message = {
            to: user.expoPushToken,//modificar para que tome el request
            sound: "default",
            title,
            body,
            data: typeof data === "object" ? data : { value: data },
        };

        let chunks = expo.chunkPushNotifications([message]);

        for (let chunk of chunks) {
            try {
                let receipts = await expo.sendPushNotificationsAsync(chunk);
                console.log("Notificación enviada:", receipts);
            } catch (err) {
                console.error("Error enviando notificación:", err);
            }
        }
        await Notification.create({ title, body, data, userId })
        res.status(200).json({ message: "status notification send it" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error sending notification");
    }
};

module.exports = { notification };
