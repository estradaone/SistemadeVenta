require('dotenv').config();

const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'admin',
        database: process.env.DB_NAME || 'artesania',
        port: Number(process.env.DB_PORT || 3306),
    },
    baseUrl: process.env.BASE_URL || 'https://sistemadeventa.onrender.com',
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
};

module.exports = config;
