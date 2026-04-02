@echo off
REM 🚀 SCRIPT DE DEPLOY AUTOMATIZADO - WINDOWS
REM Solução Industrial - Deploy para Produção

echo 🚀 Iniciando deploy da Solução Industrial...

REM 1️⃣ Limpar builds anteriores
echo 🧹 Limpando builds anteriores...
if exist .next (
    rmdir /s /q .next
    if %errorlevel% neq 0 (
        echo ❌ ERRO: Falha ao limpar .next
        pause
        exit /b 1
    )
    echo ✅ Build anterior limpo
)

REM 2️⃣ Instalar dependências
echo 📦 Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ ERRO: Falha na instalação de dependências
    pause
    exit /b 1
)
echo ✅ Dependências instaladas

REM 3️⃣ Type checking
echo 🔍 Verificando tipos TypeScript...
call npm run type-check
if %errorlevel% neq 0 (
    echo ❌ ERRO: TypeScript type checking falhou
    pause
    exit /b 1
)
echo ✅ TypeScript verificado

REM 4️⃣ Linting
echo 🔧 Executando linting...
call npm run lint:fix
if %errorlevel% neq 0 (
    echo ❌ ERRO: Linting falhou
    pause
    exit /b 1
)
echo ✅ Linting concluído

REM 5️⃣ Build
echo 🏗️ Construindo aplicação...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERRO: Build falhou
    pause
    exit /b 1
)
echo ✅ Build concluído

REM 6️⃣ Verificar build
echo 📋 Verificando build...
if exist .next (
    echo ✅ Build gerado com sucesso
    echo 📊 Tamanho do build:
    dir .next /s
) else (
    echo ❌ ERRO: Build não foi gerado
    pause
    exit /b 1
)

REM 7️⃣ Testar em modo produção
echo 🧪 Testando em modo produção...
start /b npm start
timeout /t 5 /nobreak > nul
tasklist | find "node.exe" > nul
if %errorlevel% equ 0 (
    echo ✅ Aplicação iniciou em modo produção
    taskkill /f /im node.exe > nul 2>&1
) else (
    echo ❌ ERRO: Falha ao iniciar em modo produção
    pause
    exit /b 1
)

REM 8️⃣ Resumo do deploy
echo.
echo 🎉 DEPLOY CONCLUÍDO COM SUCESSO!
echo 📋 Resumo:
echo   • TypeScript: ✅
echo   • Linting: ✅
echo   • Build: ✅
echo   • Teste produção: ✅
echo.
echo 🚀 Para iniciar em produção:
echo   npm start
echo.
echo 🌐 Acessar em:
echo   http://localhost:3000
echo.
echo ✨ Deploy finalizado!
pause
