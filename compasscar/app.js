const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000; // Altere para outra porta se necessário

// Configuração do middleware
app.use(express.json());

// Conectar ao banco de dados MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'compasscar' // Nome do banco de dados
});

connection.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
  console.log('Conectado ao banco de dados MySQL');
});

// Endpoint POST para criar carros
app.post('/api/v1/cars', (req, res) => {
    const { brand, model, year, items } = req.body;
  
    // Validações
    if (!brand) {
      return res.status(400).json({ message: 'brand is required' });
    }
    if (!model) {
      return res.status(400).json({ message: 'model is required' });
    }
    if (!year) {
      return res.status(400).json({ message: 'year is required' });
    }
    if (!items) {
      return res.status(400).json({ message: 'items are required' });
    }
    if (year < 2015 || year > 2025) {
      return res.status(400).json({ message: 'year should be between 2015 and 2025' });
    }
  
    // Verificar se o carro já existe
    connection.query(
      'SELECT * FROM cars WHERE brand = ? AND model = ? AND year = ?',
      [brand, model, year],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        if (results.length > 0) {
          return res.status(409).json({ message: 'there is already a car with this data' });
        }
  
        // Inserir o carro
        connection.query(
          'INSERT INTO cars (brand, model, year) VALUES (?, ?, ?)',
          [brand, model, year],
          (err, results) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }
  
            const carId = results.insertId;
  
            // Inserir os itens
            const uniqueItems = [...new Set(items)];
            const itemValues = uniqueItems.map(item => [item, carId]);
  
            // Usar INSERT IGNORE para evitar erros de duplicata
            connection.query(
              'INSERT IGNORE INTO cars_items (name, car_id) VALUES ?',
              [itemValues],
              (err) => {
                if (err) {
                  console.error('Erro ao inserir itens:', err);
                  return res.status(500).json({ message: 'Database error' });
                }
  
                res.status(201).json({ id: carId });
              }
            );
          }
        );
      }
    );
  });
  

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
