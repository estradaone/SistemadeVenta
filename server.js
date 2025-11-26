const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 3000;

http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en http://0.0.0.0:${PORT}`);
});
