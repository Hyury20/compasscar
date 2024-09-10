const connection = require('./db'); // Importa a conexão com o banco de dados

// Função para adicionar carro
const addCar = (req, res) => {
  const { brand, model, year, items } = req.body;

  // Validações
  if (!brand) return res.status(400).json({ message: 'brand is required' });
  if (!model) return res.status(400).json({ message: 'model is required' });
  if (!year) return res.status(400).json({ message: 'year is required' });
  if (!items || !Array.isArray(items) || items.length === 0) 
    return res.status(400).json({ message: 'items are required' });

  const currentYear = new Date().getFullYear();
  if (year < 2015 || year > currentYear) 
    return res.status(400).json({ message: 'year should be between 2015 and ' + currentYear });

  // Verifica se o carro já existe
  const checkCarQuery = 'SELECT * FROM cars WHERE brand = ? AND model = ? AND year = ?';
  connection.query(checkCarQuery, [brand, model, year], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) 
      return res.status(409).json({ message: 'there is already a car with this data' });

    // Remove itens duplicados
    const uniqueItems = [...new Set(items)];

    // Adiciona o carro
    const insertCarQuery = 'INSERT INTO cars (brand, model, year) VALUES (?, ?, ?)';
    connection.query(insertCarQuery, [brand, model, year], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      const carId = results.insertId;

      // Adiciona itens relacionados ao carro
      const insertItemsQuery = 'INSERT INTO cars_items (name, car_id) VALUES ?';
      const itemsValues = uniqueItems.map(item => [item, carId]);

      connection.query(insertItemsQuery, [itemsValues], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        res.status(201).json({ id: carId });
      });
    });
  });
};

module.exports = { addCar };
