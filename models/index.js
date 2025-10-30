require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);

const User = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  expoPushToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  linkFoto: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Message = sequelize.define("Message", {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

const Score = sequelize.define("Score", {
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

const Notification = sequelize.define("Notification", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

const Pay = sequelize.define("Payment", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  idBuyer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  external_reference: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Services = sequelize.define("Services", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profesion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  linkFoto: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});


User.hasMany(Message, { as: "messages" });
Message.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Services, { as: "services" });
Services.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Score, { as: "scores" });
Score.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Notification, { as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Pay, { as: "payments" });
Pay.belongsTo(User, { foreignKey: "userId" });

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synchronized!");
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
  });

module.exports = { sequelize, User, Message, Score, Pay, Notification, Services };
