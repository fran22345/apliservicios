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
  }
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

sequelize.sync();

module.exports = { sequelize, User, Message, Score };