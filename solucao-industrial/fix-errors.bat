@echo off
REM 🔧 SCRIPT AUTOMÁTICO DE CORREÇÃO DE ERROS
REM Solução Industrial - Versão Windows

echo 🚀 Iniciando correção automática de erros...

REM 1️⃣ Limpar caches e builds
echo 🧹 Limpando caches e builds...
if exist .next (
    rmdir /s /q .next
    echo ✅ .next removido
)
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ node_modules removido
)
if exist server\node_modules (
    rmdir /s /q server\node_modules
    echo ✅ server\node_modules removido
)

REM 2️⃣ Limpar cache npm
echo 🧹 Limpando cache npm...
call npm cache clean --force
echo ✅ Cache npm limpo

REM 3️⃣ Reinstalar dependências
echo 📦 Reinstalando dependências do frontend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)
echo ✅ Dependências do frontend instaladas

echo 📦 Reinstalando dependências do backend...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)
cd ..
echo ✅ Dependências do backend instaladas

REM 4️⃣ Verificar arquivo .env.local
echo 🔍 Verificando configuração...
if not exist .env.local (
    echo ⚠️ .env.local não encontrado. Copiando exemplo...
    copy .env.example .env.local
    echo ❗ EDITE .env.local COM SUAS CREDENCIAIS DO SUPABASE!
    echo ❗ PRESSIONE QUALQUER TECLA PARA CONTINUAR...
    pause
) else (
    echo ✅ .env.local encontrado
)

REM 5️⃣ Verificar build
echo 🏗️ Testando build do frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build falhou. Verifique os erros acima.
    pause
    exit /b 1
)
echo ✅ Build do frontend sucesso

REM 6️⃣ Iniciar servidores
echo 🚀 Iniciando servidores...
echo.
echo 🌐 Iniciando frontend na porta 3000...
start "Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo 🔌 Iniciando backend na porta 3001...
cd server
start "Backend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Correção automática concluída!
echo.
echo 📋 SERVIÇOS INICIADOS:
echo    🌐 Frontend: http://localhost:3000
echo    🔌 Backend:  http://localhost:3001
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Configure .env.local se necessário
echo    2. Acesse http://localhost:3000
echo    3. Teste o login
echo    4. Verifique a página de grupos
echo.
echo 📋 SE PERSISTIREM ERROS:
echo    1. Abra o console do navegador (F12)
echo    2. Verifique os logs nos terminais
echo    3. Me informe os erros exatos
echo.
pause
