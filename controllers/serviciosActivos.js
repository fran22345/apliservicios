const { Pay } = require('../models');

const serciciosActivos = async (req, res) => {

    const { userId } = req.query;

    try {

        if (!userId) {
            return res.status(400).json({ error: "id is required" });
        }

        const user = await Pay.findAll({
            where: { userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user || []);
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const serciciosActivosBuyer = async (req, res) => {

    const { userId } = req.query;

    try {

        if (!userId) {
            return res.status(400).json({ error: "id is required" });
        }

        const user = await Pay.findAll({
            where: { userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user || []);
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { serciciosActivos, serciciosActivosBuyer };
