const express = require('express');
const { sequelize, User, Message, Score } = require('./models');

const app = express();
app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await User.findAll({
    include: [{ model: Message, as: 'messages' }, { model: Score, as: 'scores' }]
  });
  res.json(users);
});

app.post('/users', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.create({ username, password });
  res.json(user);
});

app.get('/messages', async (req, res) => {
  const messages = await Message.findAll({
    include: [{ model: User, as: 'user' }]
  });
  res.json(messages);
});

app.post('/messages', async (req, res) => {
  const { userId, content } = req.body;
  const message = await Message.create({ userId, content });
  res.json(message);
});

app.get('/scores', async (req, res) => {
  const scores = await Score.findAll({
    include: [{ model: User, as: 'user' }]
  });
  res.json(scores);
});

app.post('/scores', async (req, res) => {
  const { userId, value } = req.body;
  const score = await Score.create({ userId, value });
  res.json(score);
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync(); 
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();