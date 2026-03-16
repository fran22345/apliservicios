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
    port: process.env.DB_PORT || 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
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
    validate: { isUrl: true },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const serciciosActivosDb = sequelize.define("ServicioActivo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  compradorId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vendedorId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  external_reference: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM("pending", "paid", "in_progress", "completed", "cancelled"),
    defaultValue: "pending",
  },
  tipoServicio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Message = sequelize.define("Message", {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

const Score = sequelize.define(
  "Score",
  {
    buyerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "scores",
    freezeTableName: true,
    timestamps: true,
  }
);

const Availability = sequelize.define("Availability", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  buyerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending"
  }
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
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
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
    validate: { isUrl: true },
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


User.hasMany(serciciosActivosDb, { foreignKey: "compradorId", as: "comprasActivas" });
serciciosActivosDb.belongsTo(User, { foreignKey: "compradorId", as: "comprador" });

User.hasMany(serciciosActivosDb, { foreignKey: "vendedorId", as: "ventasActivas" });
serciciosActivosDb.belongsTo(User, { foreignKey: "vendedorId", as: "vendedor" });


User.hasMany(Score, { foreignKey: "userId", as: "scoresReceived" });
Score.belongsTo(User, { foreignKey: "userId", as: "seller" });

User.hasMany(Score, { foreignKey: "buyerId", as: "scoresGiven" });
Score.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });

Availability.belongsTo(User, { foreignKey: "providerId", as: "provider" });
Availability.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Availability.belongsTo(Services, { foreignKey: "serviceId", as: "service" });


Score.belongsTo(Pay, { foreignKey: "payId", as: "payment" });
Pay.hasMany(Score, { foreignKey: "payId", as: "scores" });


User.hasMany(Notification, { as: "notifications", foreignKey: "userId" });
Notification.belongsTo(User, { as: "user", foreignKey: "userId" });


User.hasMany(Pay, { foreignKey: "userId", as: "payments" });
Pay.belongsTo(User, { foreignKey: "userId", as: "seller" });

User.hasMany(Pay, { foreignKey: "googleId", as: "purchases" });
Pay.belongsTo(User, { foreignKey: "googleId", as: "buyer" });


sequelize
  .sync({ force: false })
  .then(() => console.log("Database synchronized!"))
  .catch((error) => console.error("Error synchronizing database:", error));

module.exports = { sequelize, User, Message, Score, Pay, Notification, Services, Availability };
