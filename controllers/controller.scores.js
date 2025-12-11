const { Score } = require("../models");

const scores = async (req, res) => {
    const { userId, buyerId, payId, value } = req.body;
    
    try {
        if (!userId || !buyerId || !payId || !value) {

            return res.status(400).json({ msg: "Faltan datos requeridos" });
        }
    
        
        const existing = await Score.findOne({
            where: {
                userId,
                buyerId,
                payId
            }
        });

        if (existing) {
            return res.status(400).json({ msg: "Ya calificaste este servicio." });
        }

        const score = await Score.create({
            userId,
            buyerId,
            payId,
            value
        });

        return res.json(score);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Error al guardar la calificación" });
    }
};

module.exports = { scores };
