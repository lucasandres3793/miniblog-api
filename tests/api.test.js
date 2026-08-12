const request = require('supertest');
const app     = require('../server');
const pool    = require('../db/pool');

afterAll(async () => {
  await pool.end();
});

describe('GET /api/authors', () => {
  it('debe retornar 200 y un array', async () => {
    const res = await request(app).get('/api/authors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/authors', () => {
  let createdId;

  it('debe crear un author y retornar 201', async () => {
    const res = await request(app)
      .post('/api/authors')
      .send({ name: 'Test Author', email: `test_${Date.now()}@test.com` });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
  });

  it('debe retornar 400 si falta name', async () => {
    const res = await request(app)
      .post('/api/authors')
      .send({ email: 'falta@name.com' });
    expect(res.status).toBe(400);
  });

  it('debe retornar 400 si falta email', async () => {
    const res = await request(app)
      .post('/api/authors')
      .send({ name: 'Sin Email' });
    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    if (createdId) await pool.query('DELETE FROM authors WHERE id = $1', [createdId]);
  });
});

describe('GET /api/authors/:id', () => {
  it('debe retornar 404 para author inexistente', async () => {
    const res = await request(app).get('/api/authors/99999');
    expect(res.status).toBe(404);
  });

  it('debe retornar 400 para id no numérico', async () => {
    const res = await request(app).get('/api/authors/abc');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  it('debe retornar 200 y un array', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/posts', () => {
  let testAuthorId;
  let createdPostId;

  beforeAll(async () => {
    const result = await pool.query(
      "INSERT INTO authors (name, email) VALUES ('Post Tester', $1) RETURNING id",
      [`posttester_${Date.now()}@test.com`]
    );
    testAuthorId = result.rows[0].id;
  });

  it('debe crear un post y retornar 201', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test Post', content: 'Contenido de prueba', author_id: testAuthorId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdPostId = res.body.id;
  });

  it('debe retornar 400 si falta title', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ content: 'contenido', author_id: testAuthorId });
    expect(res.status).toBe(400);
  });

  it('debe retornar 400 si author_id no existe', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test', content: 'contenido', author_id: 99999 });
    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    if (testAuthorId) await pool.query('DELETE FROM authors WHERE id = $1', [testAuthorId]);
  });
});

describe('GET /api/posts/:id', () => {
  it('debe retornar 404 para post inexistente', async () => {
    const res = await request(app).get('/api/posts/99999');
    expect(res.status).toBe(404);
  });
});
