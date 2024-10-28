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
  const { nombre, apellido, profesion, linkFoto } = req.body;
  const user = await User.create({ nombre, apellido, profesion, linkFoto });
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
  console.log(scores);
  
  res.json(scores);
});

app.get('/scores/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const averageScore = await Score.findOne({
      where: { userId },
      attributes: [[sequelize.fn('AVG', sequelize.col('value')), 'Score']]
    });
    res.json(averageScore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the average score.' });
  }
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