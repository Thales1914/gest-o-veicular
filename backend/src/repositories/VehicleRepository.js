const vehicleFields = `
  id,
  user_id,
  brand,
  model,
  year,
  plate,
  current_mileage,
  created_at,
  updated_at
`;

export class VehicleRepository {
  constructor(db) {
    this.db = db;
  }

  async create(userId, vehicle) {
    const result = await this.db.query(
      `INSERT INTO vehicles (user_id, brand, model, year, plate, current_mileage)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${vehicleFields}`,
      [
        userId,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.plate,
        vehicle.current_mileage,
      ],
    );

    return result.rows[0];
  }

  async findAllByUserId(userId) {
    const result = await this.db.query(
      `SELECT ${vehicleFields}
       FROM vehicles
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [userId],
    );

    return result.rows;
  }

  async findByIdAndUserId(id, userId) {
    const result = await this.db.query(
      `SELECT ${vehicleFields}
       FROM vehicles
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    return result.rows[0] ?? null;
  }
}

