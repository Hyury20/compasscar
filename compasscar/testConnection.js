const connection = require('./db');

// Testar a conexão com uma consulta simples
connection.query('SELECT 1 + 1 AS solution', (err, results, fields) => {
  if (err) {
    console.error('Erro ao realizar a consulta:', err);
    return;
  }
  console.log('Resultado da consulta:', results[0].solution);
});

// Fechar a conexão
connection.end();
