const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Importar a função para adicionar carro
const { addCar } = require('./carController');

app.post('/api/v1/cars', addCar);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
