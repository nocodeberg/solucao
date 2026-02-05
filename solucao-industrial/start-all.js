#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('\n🚀 Iniciando Solução Industrial...\n');

// Comandos para iniciar os servidores
const commands = [
  {
    name: 'Backend API',
    cmd: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'server'),
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Frontend Next.js',
    cmd: 'npx',
    args: ['next', 'dev'],
    cwd: __dirname,
    color: '\x1b[35m', // Magenta
  },
];

const reset = '\x1b[0m';

// Iniciar cada comando
const processes = commands.map((config) => {
  console.log(`${config.color}▶ Iniciando ${config.name}...${reset}\n`);

  const proc = spawn(config.cmd, config.args, {
    cwd: config.cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Prefix para as mensagens
  const prefix = `${config.color}[${config.name}]${reset} `;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter((line) => line.trim());
    lines.forEach((line) => console.log(prefix + line));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter((line) => line.trim());
    lines.forEach((line) => console.error(prefix + line));
  });

  proc.on('exit', (code) => {
    console.log(`\n${prefix}Processo encerrado com código ${code}\n`);
  });

  return proc;
});

// Tratar Ctrl+C para encerrar todos os processos
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando todos os servidores...\n');

  processes.forEach((proc, index) => {
    try {
      proc.kill();
      console.log(`✅ ${commands[index].name} encerrado`);
    } catch (error) {
      console.error(`❌ Erro ao encerrar ${commands[index].name}:`, error.message);
    }
  });

  console.log('\n👋 Até logo!\n');
  process.exit(0);
});

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  console.error('\n❌ Erro não capturado:', error);
  process.exit(1);
});

console.log('✅ Servidores iniciados!\n');
console.log('📡 Frontend: http://localhost:3000');
console.log('🔌 Backend API: http://localhost:3001');
console.log('\n💡 Pressione Ctrl+C para encerrar todos os servidores\n');
