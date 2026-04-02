#!/bin/bash

echo "🚀 Iniciando correção automática de erros..."

# 1️⃣ Limpar caches e builds
echo "🧹 Limpando caches e builds..."
rm -rf .next
rm -rf node_modules
rm -rf server/node_modules
echo "✅ Diretórios removidos"

# 2️⃣ Limpar cache npm
echo "🧹 Limpando cache npm..."
npm cache clean --force
echo "✅ Cache npm limpo"

# 3️⃣ Reinstalar dependências
echo "📦 Reinstalando dependências do frontend..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi
echo "✅ Dependências do frontend instaladas"

echo "📦 Reinstalando dependências do backend..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi
cd ..
echo "✅ Dependências do backend instaladas"

# 4️⃣ Verificar arquivo .env.local
echo "🔍 Verificando configuração..."
if [ ! -f ".env.local" ]; then
    echo "⚠️ .env.local não encontrado. Copiando exemplo..."
    cp .env.example .env.local
    echo "❗ EDITE .env.local COM SUAS CREDENCIAIS DO SUPABASE!"
    echo "❗ PRESSIONE ENTER PARA CONTINUAR..."
    read
else
    echo "✅ .env.local encontrado"
fi

# 5️⃣ Verificar build
echo "🏗️ Testando build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build falhou. Verifique os erros acima."
    exit 1
fi
echo "✅ Build do frontend sucesso"

# 6️⃣ Iniciar servidores
echo "🚀 Iniciando servidores..."
echo ""
echo "🌐 Iniciando frontend na porta 3000..."
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "🔌 Iniciando backend na porta 3001..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

echo ""
echo "✅ Correção automática concluída!"
echo ""
echo "📋 SERVIÇOS INICIADOS:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔌 Backend:  http://localhost:3001"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Configure .env.local se necessário"
echo "   2. Acesse http://localhost:3000"
echo "   3. Teste o login"
echo "   4. Verifique a página de grupos"
echo ""
echo "📋 SE PERSISTIREM ERROS:"
echo "   1. Abra o console do navegador (F12)"
echo "   2. Verifique os logs nos terminais"
echo "   3. Me informe os erros exatos"
echo ""
echo "🔌 Para parar os servidores: kill $FRONTEND_PID $BACKEND_PID"
echo ""

# Manter script rodando para não fechar os processos
wait
