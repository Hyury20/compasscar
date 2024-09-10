const mysql = require('mysql2');

// Crie a conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'localhost',       // Seu host do MySQL (ex.: localhost)
  user: 'root',            // Substitua pelo seu usuário MySQL
  password: '',            // Substitua pela sua senha MySQL
  database: 'compasscar'   // Nome do banco de dados já criado
});

// Conecte-se ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.stack);
    return;
  }
  console.log('Conectado ao MySQL como id', connection.threadId);
});

module.exports = connection;
