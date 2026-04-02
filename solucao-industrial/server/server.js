const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API está funcionando!', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Rotas da aplicação
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/production-lines', require('./routes/production-lines'));
app.use('/api/products', require('./routes/products'));
app.use('/api/pieces', require('./routes/pieces'));
app.use('/api/manutencao', require('./routes/manutencao'));
app.use('/api/consumo-agua', require('./routes/consumo-agua'));
app.use('/api/lancamento-mo', require('./routes/lancamento-mo'));
app.use('/api/encargos', require('./routes/encargos'));
app.use('/api/cargos', require('./routes/cargos'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware de erro 404
app.use((req, res) => {
  console.error(`❌ 404 - Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Middleware de erro geral
app.use((err, req, res, next) => {
  console.error(`❌ Erro no servidor:`, err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
  console.log(`🌐 API disponível em: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Teste: http://localhost:${PORT}/api/test`);
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

module.exports = app;
