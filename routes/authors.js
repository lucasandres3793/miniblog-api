const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// GET /api/authors - devuelve todos los autores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM authors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/authors/:id - devuelve un autor por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const result = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Author not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/authors - crea un nuevo autor
router.post('/', async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const result = await pool.query(
      'INSERT INTO authors (name, email, bio) VALUES ($1, $2, $3) RETURNING *',
      [name, email, bio || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/authors/:id - actualiza un autor completo
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const { name, email, bio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const result = await pool.query(
      'UPDATE authors SET name = $1, email = $2, bio = $3 WHERE id = $4 RETURNING *',
      [name, email, bio || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Author not found' });

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/authors/:id - elimina un autor
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const result = await pool.query(
      'DELETE FROM authors WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Author not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
