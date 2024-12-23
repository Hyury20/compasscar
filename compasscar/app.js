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
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: 'items must be an array' });
  }
  if (items.length === 0) {
    return res.status(400).json({ message: 'items array cannot be empty' });
  }

  const currentYear = new Date().getFullYear(); // Obter o ano atual
  if (year < 2015 || year > currentYear) {
    return res.status(400).json({ message: `year should be between 2015 and ${currentYear}` });
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


// Endpoint GET para listar carros
app.get('/api/v1/cars', (req, res) => {
  const { page = 1, limit = 5, brand, model, year } = req.query;

  // Validações de limite
  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = 5; // Limite padrão se for inválido ou menor que 1
  } else if (parsedLimit > 10) {
    parsedLimit = 10; // Limite máximo de 10
  }

  const offset = (page - 1) * parsedLimit; // Cálculo do offset para a paginação

  // Construção da query e dos parâmetros
  let query = 'SELECT cars.id, brand, model, year, GROUP_CONCAT(cars_items.name) AS items FROM cars LEFT JOIN cars_items ON cars.id = cars_items.car_id';
  let queryParams = [];
  let countQuery = 'SELECT COUNT(*) AS count FROM cars'; // Query para contar os carros
  let countParams = [];

  // Filtros opcionais
  if (brand) {
    query += ' WHERE brand LIKE ?';
    queryParams.push(`%${brand}%`);
    countQuery += ' WHERE brand LIKE ?';
    countParams.push(`%${brand}%`);
  }
  if (model) {
    query += brand ? ' AND model LIKE ?' : ' WHERE model LIKE ?';
    queryParams.push(`%${model}%`);
    countQuery += brand ? ' AND model LIKE ?' : ' WHERE model LIKE ?';
    countParams.push(`%${model}%`);
  }
  if (year) {
    query += (brand || model) ? ' AND year >= ?' : ' WHERE year >= ?';
    queryParams.push(year);
    countQuery += (brand || model) ? ' AND year >= ?' : ' WHERE year >= ?';
    countParams.push(year);
  }

  query += ' GROUP BY cars.id LIMIT ? OFFSET ?';
  queryParams.push(parsedLimit, offset);

  // Primeiro, obter a contagem total de carros com base nos filtros
  connection.query(countQuery, countParams, (err, countResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    const totalCars = countResults[0].count;
    if (totalCars === 0) {
      return res.status(204).send(); // Nenhum conteúdo
    }

    // Depois, obter os dados dos carros com paginação e filtros
    connection.query(query, queryParams, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      const totalPages = Math.ceil(totalCars / parsedLimit);

      // Formatar os itens para cada carro
      const cars = results.map(car => ({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        items: car.items ? car.items.split(',') : []
      }));

      res.status(200).json({
        count: totalCars,
        pages: totalPages,
        data: cars
      });
    });
  });
});

// Endpoint GET para buscar carro por ID
app.get('/api/v1/cars/:id', (req, res) => {
  const carId = req.params.id;

  connection.query('SELECT cars.id, brand, model, year, GROUP_CONCAT(cars_items.name) AS items FROM cars LEFT JOIN cars_items ON cars.id = cars_items.car_id WHERE cars.id = ?', [carId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'car not found' });
    }

    const car = results[0];
    res.status(200).json({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      items: car.items ? car.items.split(',') : []
    });
  });
});

// Endpoint PATCH para atualizar carro
app.patch('/api/v1/cars/:id', (req, res) => {
  const carId = req.params.id;
  const { brand, model, year, items } = req.body;

  // Validações de year e items
  const currentYear = new Date().getFullYear(); // Obter o ano atual
  if (year && (year < 2015 || year > currentYear)) {
    return res.status(400).json({ message: `year should be between 2015 and ${currentYear}` });
  }
  if (items && !Array.isArray(items)) {
    return res.status(400).json({ message: 'items should be an array' });
  }

  // Verificar se o carro existe
  connection.query('SELECT * FROM cars WHERE id = ?', [carId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'car not found' });
    }

    // Verificar se já existe um carro com os mesmos dados, excluindo o carro atual
    connection.query('SELECT * FROM cars WHERE brand = ? AND model = ? AND year = ? AND id != ?', [brand, model, year, carId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (results.length > 0) {
        return res.status(409).json({ message: 'there is already a car with this data' });
      }

      // Preparar os campos a serem atualizados
      const updateFields = [];
      const queryParams = [];

      if (brand) {
        updateFields.push('brand = ?');
        queryParams.push(brand);
      }
      if (model) {
        updateFields.push('model = ?');
        queryParams.push(model);
      }
      if (year) {
        updateFields.push('year = ?');
        queryParams.push(year);
      }

      queryParams.push(carId);

      // Atualizar o carro
      connection.query(`UPDATE cars SET ${updateFields.join(', ')} WHERE id = ?`, queryParams, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        // Atualizar os itens
        if (items) {
          const uniqueItems = [...new Set(items)];
          const itemValues = uniqueItems.map(item => [item, carId]);

          // Limpar itens antigos e inserir novos
          connection.query('DELETE FROM cars_items WHERE car_id = ?', [carId], (err) => {
            if (err) {
              return res.status(500).json({ message: 'Database error' });
            }

            connection.query('INSERT IGNORE INTO cars_items (name, car_id) VALUES ?', [itemValues], (err) => {
              if (err) {
                return res.status(500).json({ message: 'Database error' });
              }

              res.status(200).json({ message: 'car updated successfully' });
            });
          });
        } else {
          res.status(200).json({ message: 'car updated successfully' });
        }
      });
    });
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
