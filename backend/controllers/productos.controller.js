const db = require('../config/db');

exports.getProductos = (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

exports.createProducto = (req, res) => {
  const { nombre, precio, descripcion, imagen, stock } = req.body;

  db.query(
    'INSERT INTO productos (nombre, precio, descripcion, imagen, stock) VALUES (?, ?, ?, ?, ?)',
    [nombre, precio, descripcion, imagen, stock],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Producto creado' });
    }
  );
};