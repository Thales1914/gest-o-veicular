export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const result = await this.db.query(
      `SELECT id, name, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async create({ name, email, passwordHash }) {
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [name, email, passwordHash],
    );

    return result.rows[0];
  }
}
