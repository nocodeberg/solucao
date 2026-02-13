require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARES DE SEGURANÇA
// =====================================================

// Helmet - Proteção de headers HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Apenas frontend autorizado
const corsOptions = {
  origin: function (origin, callback) {
    // Em desenvolvimento, permitir QUALQUER origem
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Em produção, validar origem
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

app.use(cors(corsOptions));

// Rate Limiting - Prevenir ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting mais restritivo para rotas sensíveis
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Apenas 5 tentativas
  message: 'Muitas tentativas, tente novamente em 15 minutos.',
});

app.use('/api/auth/login', strictLimiter);

// Body parser com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compressão de respostas
app.use(compression());

// Logger de requisições (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware de validação de API Key (opcional, comentado)
// app.use('/api/', (req, res, next) => {
//   const apiKey = req.headers['x-api-key'];
//   if (!apiKey || apiKey !== process.env.API_KEY) {
//     return res.status(401).json({ error: 'API Key inválida' });
//   }
//   next();
// });

// =====================================================
// ROTAS
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Importar rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const employeesRoutes = require('./routes/employees');
const productionLinesRoutes = require('./routes/productionLines');
const productsRoutes = require('./routes/products');
const groupsRoutes = require('./routes/groups');
const piecesRoutes = require('./routes/pieces');
const manutencaoRoutes = require('./routes/manutencao');
const consumoAguaRoutes = require('./routes/consumoAgua');
const lancamentoMORoutes = require('./routes/lancamentoMO');
const encargosRoutes = require('./routes/encargos');
const cargosRoutes = require('./routes/cargos');
const usersRoutes = require('./routes/users');
const setupRoutes = require('./routes/setup');

// Usar rotas
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/setup', setupRoutes); // ⚠️ TEMPORÁRIO - apenas em desenvolvimento
}
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/production-lines', productionLinesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/pieces', piecesRoutes);
app.use('/api/manutencao', manutencaoRoutes);
app.use('/api/consumo-agua', consumoAguaRoutes);
app.use('/api/lancamento-mo', lancamentoMORoutes);
app.use('/api/encargos', encargosRoutes);
app.use('/api/cargos', cargosRoutes);
app.use('/api/users', usersRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 - Not Found
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Acesso negado - origem não autorizada' });
  }

  // Erro de validação
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.errors
    });
  }

  // Erro padrão
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor backend rodando!`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔒 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ CORS habilitado para: ${process.env.FRONTEND_URL}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido, encerrando servidor...');
  process.exit(0);
});
