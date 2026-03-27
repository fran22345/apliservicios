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
  expoPushToken: DataTypes.STRING,
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
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

const Services = sequelize.define("Services", {
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  profesion: { type: DataTypes.STRING, allowNull: false },
  linkFoto: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isUrl: true },
  },
  description: DataTypes.TEXT,
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Availability = sequelize.define("Availability", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  providerId: { type: DataTypes.STRING, allowNull: false },
  buyerId: { type: DataTypes.STRING, allowNull: false },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "accepted",
      "rejected",
      "in_progress",
      "completed"
    ),
    defaultValue: "pending",
  },
});

const serciciosActivosDb = sequelize.define("ServicioActivo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  compradorId: { type: DataTypes.STRING, allowNull: false },
  vendedorId: { type: DataTypes.STRING, allowNull: false },
  external_reference: { type: DataTypes.STRING, allowNull: false },
  estado: {
    type: DataTypes.ENUM(
      "pending",
      "paid",
      "in_progress",
      "completed",
      "cancelled"
    ),
    defaultValue: "pending",
  },
  tipoServicio: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.STRING,
});

const Message = sequelize.define("Message", {
  content: { type: DataTypes.TEXT, allowNull: false },
});

const Score = sequelize.define(
  "Score",
  {
    buyerId: { type: DataTypes.STRING, allowNull: false },
    payId: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.FLOAT, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "scores",
    freezeTableName: true,
  }
);

const Notification = sequelize.define("Notification", {
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.STRING, allowNull: false },
  data: DataTypes.JSON,
});

const Pay = sequelize.define("Payment", {
  userId: { type: DataTypes.STRING, allowNull: false },
  idBuyer: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  unit_price: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  external_reference: { type: DataTypes.STRING, allowNull: false },
});


// Services
User.hasMany(Services, {
  foreignKey: "userId",
  as: "services",
});
Services.belongsTo(User, {
  foreignKey: "userId",
});

// Message
User.hasMany(Message, {
  foreignKey: "userId",
  as: "messages",
});
Message.belongsTo(User, {
  foreignKey: "userId",
});

// Score
Services.hasMany(Score, {
  foreignKey: "serviceId",
  as: "scores",
});
Score.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
});

User.hasMany(Score, {
  foreignKey: "userId",
  as: "scoresReceived",
});
User.hasMany(Score, {
  foreignKey: "buyerId",
  as: "scoresGiven",
});

Score.belongsTo(User, {
  foreignKey: "userId",
  as: "seller",
});
Score.belongsTo(User, {
  foreignKey: "buyerId",
  as: "buyer",
});

// Availability
Availability.belongsTo(User, {
  foreignKey: "providerId",
  as: "provider",
});
Availability.belongsTo(User, {
  foreignKey: "buyerId",
  as: "buyer",
});
Availability.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
});

// Servicios activos
User.hasMany(serciciosActivosDb, {
  foreignKey: "compradorId",
  as: "comprasActivas",
});
User.hasMany(serciciosActivosDb, {
  foreignKey: "vendedorId",
  as: "ventasActivas",
});

serciciosActivosDb.belongsTo(User, {
  foreignKey: "compradorId",
  as: "comprador",
});
serciciosActivosDb.belongsTo(User, {
  foreignKey: "vendedorId",
  as: "vendedor",
});

// Payments (sin romper nombres)
User.hasMany(Pay, {
  foreignKey: "userId",
  as: "payments",
});
Pay.belongsTo(User, {
  foreignKey: "userId",
  as: "seller",
});

User.hasMany(Pay, {
  foreignKey: "idBuyer",
  as: "purchases",
});
Pay.belongsTo(User, {
  foreignKey: "idBuyer",
  as: "buyer",
});

// Notifications
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Score - Payment
Score.belongsTo(Pay, {
  foreignKey: "payId",
  as: "payment",
});
Pay.hasMany(Score, {
  foreignKey: "payId",
  as: "scores",
});


sequelize
  .sync({ alter: false })
  .then(() => console.log("Database synchronized!"))
  .catch((error) => console.error("Error:", error));

module.exports = {
  sequelize,
  User,
  Services,
  Availability,
  serciciosActivosDb,
  Message,
  Score,
  Pay,
  Notification,
};