import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export class AuthService {
  constructor(userRepository, jwtConfig) {
    this.userRepository = userRepository;
    this.jwtConfig = jwtConfig;
  }

  async register(input) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordMatches) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = jwt.sign(
      { name: user.name, email: user.email },
      this.jwtConfig.secret,
      { subject: String(user.id), expiresIn: this.jwtConfig.expiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
