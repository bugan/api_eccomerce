const bcrypt = require('bcrypt');
const userRepository = require('../users/userRepository');
const AppError = require('../../utils/AppError');
const { generateAccessToken, generateRefreshToken } = require('../../utils/token');
const redisClient = require('../../config/redis');

const authService = {
    register: async (data) => {
        const { name, email, password, role } = data;

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError('Email já está em uso', 409, 'CONFLICT');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'USER'
        });

        const accessToken = generateAccessToken(newUser.id, newUser.role);
        const refreshToken = generateRefreshToken(newUser.id);

        // Salvar refresh token no Redis: chave "refresh:userId"
        // Expira em 7 dias (604800 segundos)
        await redisClient.set(`refresh:${newUser.id}`, refreshToken, {
            EX: 7 * 24 * 60 * 60
        });

        return {
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            tokens: { accessToken, refreshToken }
        };
    },

    login: async (email, password) => {
        const user = await userRepository.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Credenciais inválidas', 401, 'UNAUTHORIZED');
        }

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        await redisClient.set(`refresh:${user.id}`, refreshToken, {
            EX: 7 * 24 * 60 * 60
        });

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tokens: { accessToken, refreshToken }
        };
    }
};

module.exports = authService;
