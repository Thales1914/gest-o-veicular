import { loginSchema, registerSchema } from '../validators/authSchemas.js';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (request, response) => {
    const input = registerSchema.parse(request.body);
    const user = await this.authService.register(input);

    return response.status(201).json({ user });
  };

  login = async (request, response) => {
    const input = loginSchema.parse(request.body);
    const session = await this.authService.login(input);

    return response.json(session);
  };
}

