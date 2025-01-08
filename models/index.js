require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  }
);

const User = sequelize.define('User', {
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
  profesion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  linkFoto: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
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
});

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

const Score = sequelize.define('Score', {
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Notification = sequelize.define('Notification', {
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


User.hasMany(Message, { as: 'messages' });
Message.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Score, { as: 'scores' });
Score.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Notification, { as: 'notifications' }); 
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

sequelize.sync({ alter: false }) 
  .then(() => {
    console.log("Database synchronized!");
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
  });

module.exports = { sequelize, User, Message, Score };