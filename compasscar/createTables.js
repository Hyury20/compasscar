const connection = require('./db');

// SQL para criar a tabela 'cars'
const createCarsTable = `
CREATE TABLE IF NOT EXISTS cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL
);
`;

// SQL para criar a tabela 'cars_items'
const createCarsItemsTable = `
CREATE TABLE IF NOT EXISTS cars_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  car_id INT,
  FOREIGN KEY (car_id) REFERENCES cars(id)
);
`;

// Criar a tabela 'cars'
connection.query(createCarsTable, (err, results) => {
  if (err) {
    console.error('Erro ao criar a tabela cars:', err);
    return;
  }
  console.log('Tabela cars criada com sucesso.');
});

// Criar a tabela 'cars_items'
connection.query(createCarsItemsTable, (err, results) => {
  if (err) {
    console.error('Erro ao criar a tabela cars_items:', err);
    return;
  }
  console.log('Tabela cars_items criada com sucesso.');
});

// Fechar a conexão
connection.end();
