# MiniBlog API

API REST para gestión de autores y publicaciones, construida con Node.js, Express y PostgreSQL.

Proyecto Integrador — Módulo 2, Henry Full Stack.

---

## Descripción

MiniBlog es el backend de un servicio de contenidos. Expone endpoints CRUD para dos entidades relacionadas:

- **authors** — autores del blog
- **posts** — publicaciones, cada una asociada a un autor (relación 1:N)

La relación está protegida con una foreign key. Al eliminar un autor, sus posts se eliminan en cascada (`ON DELETE CASCADE`).

---

## Stack

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 4 |
| Base de datos | PostgreSQL 16 |
| Cliente DB | `pg` (queries SQL directas, sin ORM) |
| Testing | Jest + Supertest |
| Documentación | OpenAPI 3.0 |

---

## Estructura del proyecto
---

## Requisitos

- Node.js 20.6 o superior (usa `loadEnvFile` nativo)
- PostgreSQL 14 o superior

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/lucasandres3793/miniblog-api.git
cd miniblog-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear la base de datos y el usuario

Conectate a PostgreSQL como superusuario:

```bash
psql postgres
```

Y ejecutá:

```sql
CREATE DATABASE blog_db;
CREATE USER blog_user WITH PASSWORD 'blog_password_2026';
\c blog_db
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO blog_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blog_user;
\q
```

### 4. Crear las tablas y cargar datos de prueba

```bash
psql -U blog_user -d blog_db -f db/setup.sql
```

Esto crea las tablas `authors` y `posts`, e inserta 3 autores y 5 posts de ejemplo.

### 5. Configurar variables de entorno

```bash
cp .env.example .env
```

Editá `.env` con tus valores locales:
### 6. Levantar el servidor

```bash
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`.

---

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta el servidor en modo producción |
| `npm run dev` | Levanta el servidor con auto-reload al detectar cambios |
| `npm test` | Ejecuta la suite de tests |

---

## Endpoints

### Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Verifica que el servicio esté operativo |

### Authors

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/authors` | Lista todos los autores |
| GET | `/api/authors/:id` | Detalle de un autor |
| POST | `/api/authors` | Crea un autor |
| PUT | `/api/authors/:id` | Actualiza un autor |
| DELETE | `/api/authors/:id` | Elimina un autor (y sus posts en cascada) |

### Posts

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/posts` | Lista todos los posts |
| GET | `/api/posts?published=true` | Filtra posts por estado de publicación |
| GET | `/api/posts/:id` | Detalle de un post |
| GET | `/api/posts/author/:authorId` | Posts de un autor, con datos del autor |
| POST | `/api/posts` | Crea un post |
| PUT | `/api/posts/:id` | Actualiza un post |
| DELETE | `/api/posts/:id` | Elimina un post |

---

## Ejemplos de uso

**Crear un autor:**

```bash
curl -X POST http://localhost:3000/api/authors \
  -H "Content-Type: application/json" \
  -d '{"name":"Pedro Sánchez","email":"pedro@example.com","bio":"Experto en DevOps"}'
```

**Crear un post:**

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi post","content":"Contenido...","author_id":1,"published":true}'
```

**Listar posts de un autor con sus datos:**

```bash
curl http://localhost:3000/api/posts/author/1
```

---

## Validaciones

| Entidad | Regla |
|---|---|
| Author | `name` y `email` son obligatorios |
| Author | `email` debe ser único (constraint UNIQUE en la DB) |
| Post | `title`, `content` y `author_id` son obligatorios |
| Post | `author_id` debe referenciar un autor existente (FK) |
| Ambos | `:id` en la URL debe ser numérico |

### Códigos de respuesta

| Código | Cuándo |
|---|---|
| 200 | Operación exitosa (GET, PUT, DELETE) |
| 201 | Recurso creado (POST) |
| 400 | Datos inválidos, ID no numérico, email duplicado, FK inexistente |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

## Tests

```bash
npm test
```

La suite cubre 11 casos:

- `GET /api/authors` devuelve 200 y un array
- `POST /api/authors` crea correctamente y devuelve 201
- `POST /api/authors` devuelve 400 si falta `name`
- `POST /api/authors` devuelve 400 si falta `email`
- `GET /api/authors/:id` devuelve 404 si el autor no existe
- `GET /api/authors/:id` devuelve 400 si el ID no es numérico
- `GET /api/posts` devuelve 200 y un array
- `POST /api/posts` crea correctamente y devuelve 201
- `POST /api/posts` devuelve 400 si falta `title`
- `POST /api/posts` devuelve 400 si el `author_id` no existe
- `GET /api/posts/:id` devuelve 404 si el post no existe

Los tests crean sus propios datos y los limpian al finalizar, sin dejar residuos en la base.

---

## Documentación OpenAPI

La especificación está en `openapi.yaml`, siguiendo el estándar OpenAPI 3.0.

Para visualizarla:

**Opción 1 — Swagger Editor online:** pegá el contenido de `openapi.yaml` en https://editor.swagger.io

**Opción 2 — Extensión de VS Code:** instalá "OpenAPI (Swagger) Editor" y abrí el archivo.

---

## Decisiones técnicas

**Queries parametrizadas.** Todas las consultas usan placeholders (`$1`, `$2`) en lugar de concatenar strings. Esto previene SQL injection: los valores se envían separados de la sentencia SQL y PostgreSQL los trata como datos, nunca como código ejecutable.

**Pool de conexiones.** `db/pool.js` centraliza la conexión mediante un Pool en vez de abrir una conexión por query. El Pool mantiene conexiones abiertas y las reutiliza, lo que reduce la latencia y evita agotar el límite de conexiones de PostgreSQL bajo carga.

**Orden de rutas en posts.** `GET /api/posts/author/:authorId` está declarado antes que `GET /api/posts/:id`. Express evalúa las rutas en orden de declaración; si estuviera al revés, el string "author" sería capturado como `:id` y el endpoint nunca se alcanzaría.

**ON DELETE CASCADE en posts.** Un post no tiene sentido sin su autor. Al eliminar un autor, la base de datos elimina automáticamente sus posts, evitando registros huérfanos. La alternativa (`SET NULL`) fue descartada porque `author_id` es `NOT NULL` por diseño.

**Manejo de errores por código SQL.** Los errores de PostgreSQL se interceptan por su código: `23505` (violación de UNIQUE) devuelve 400 con "Email already exists", `23503` (violación de FK) devuelve 400 con "author_id does not exist". Esto traduce errores de base de datos en respuestas HTTP semánticamente correctas en lugar de un 500 genérico.

**Export condicional del servidor.** `server.js` solo llama a `app.listen()` si el archivo se ejecuta directamente (`require.main === module`). Cuando lo importan los tests, exporta la app sin levantar un servidor real, lo que permite a Supertest hacer requests en memoria.

---

## Registro del uso de IA

Se utilizó Claude (Anthropic) durante el desarrollo del proyecto.

### Áreas de uso

**Estructura del proyecto y scaffolding.** Se solicitó la organización de carpetas (`db/`, `routes/`, `tests/`) siguiendo convenciones estándar de Express, y la generación del boilerplate inicial de cada archivo.

**Implementación de endpoints CRUD.** Se pidió el código de los routers con queries parametrizadas, incluyendo el manejo de códigos de error de PostgreSQL (`23505`, `23503`) mapeados a respuestas HTTP.

**Tests.** Se solicitó la suite de tests con Supertest cubriendo casos de éxito y de error, con creación y limpieza de datos de prueba.

**Documentación.** Generación del archivo `openapi.yaml` según el estándar OpenAPI 3.0 y estructura de este README.

**Debugging.** Resolución de problemas puntuales del entorno local: configuración de PostgreSQL con Homebrew (usuario `lucas` en lugar de `postgres`), y errores de Git al versionar `node_modules`.

### Cómo influyó en el desarrollo

La IA aceleró la escritura de código repetitivo (los cinco endpoints de cada recurso siguen el mismo patrón) y la documentación. Las explicaciones acompañaron cada bloque de código, cubriendo el porqué de cada decisión —orden de rutas, uso de Pool, queries parametrizadas— lo que permitió entender la arquitectura en lugar de solo copiarla.

Todas las decisiones de diseño fueron revisadas y validadas ejecutando el código localmente: cada endpoint se probó con Thunder Client y los tests se corrieron hasta pasar en verde.

---

## Autor

Lucas Andrés — Henry Full Stack M2
