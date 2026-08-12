const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// GET /api/posts - devuelve todos los posts (con filtro opcional ?published=true/false)
router.get('/', async (req, res) => {
  try {
    let query  = 'SELECT * FROM posts ORDER BY created_at DESC';
    let params = [];

    if (req.query.published !== undefined) {
      query  = 'SELECT * FROM posts WHERE published = $1 ORDER BY created_at DESC';
      params = [req.query.published === 'true'];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/author/:authorId - posts de un autor con datos del autor
// DEBE ir antes de /:id para que Express no confunda "author" con un ID
router.get('/author/:authorId', async (req, res) => {
  try {
    const authorId = parseInt(req.params.authorId);
    if (isNaN(authorId)) return res.status(400).json({ error: 'authorId must be a number' });

    const result = await pool.query(`
      SELECT p.*, a.name AS author_name, a.email AS author_email, a.bio AS author_bio
      FROM posts p
      JOIN authors a ON p.author_id = a.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
    `, [authorId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:id - devuelve un post por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts - crea un nuevo post
router.post('/', async (req, res) => {
  try {
    const { title, content, author_id, published } = req.body;

    if (!title || !content || !author_id) {
      return res.status(400).json({ error: 'title, content and author_id are required' });
    }

    const result = await pool.query(
      'INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, author_id, published || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'author_id does not exist' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id - actualiza un post completo
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const { title, content, author_id, published } = req.body;
    if (!title || !content || !author_id) {
      return res.status(400).json({ error: 'title, content and author_id are required' });
    }

    const result = await pool.query(
      'UPDATE posts SET title=$1, content=$2, author_id=$3, published=$4 WHERE id=$5 RETURNING *',
      [title, content, author_id, published !== undefined ? published : false, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'author_id does not exist' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id - elimina un post
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' });

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
