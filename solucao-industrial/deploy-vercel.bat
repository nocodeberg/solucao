@echo off
REM 🚀 DEPLOY AUTOMÁTICO PARA VERCEL
REM Solução Industrial - API Direct Supabase

echo 🚀 DEPLOY PARA VERCEL
echo =====================
echo.

REM 1️⃣ Verificar se Vercel CLI está instalado
echo 🔍 Verificando Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar Vercel CLI
        pause
        exit /b 1
    )
)
echo ✅ Vercel CLI OK

REM 2️⃣ Limpar build anterior
echo 🧹 Limpando build anterior...
if exist .next rmdir /s /q .next
echo ✅ Build limpo

REM 3️⃣ Instalar dependências
echo 📦 Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências OK

REM 4️⃣ Build para produção
echo 🏗️ Buildando para produção...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build falhou
    pause
    exit /b 1
)
echo ✅ Build sucesso

REM 5️⃣ Fazer deploy
echo 🚀 Fazendo deploy para Vercel...
echo.
echo ⚠️ Será necessário fazer login na primeira vez
echo ⚠️ Configure as variáveis de ambiente quando solicitado
echo.

call vercel --prod

if %errorlevel% neq 0 (
    echo ❌ Deploy falhou
    pause
    exit /b 1
)

echo.
echo ✅ DEPLOY CONCLUÍDO COM SUCESSO!
echo ==============================
echo.
echo 📋 URL DA APLICAÇÃO:
echo    (Será mostrada acima pelo Vercel)
echo.
echo 📋 CONFIGURAÇÕES NECESSÁRIAS:
echo    1. Configure as variáveis de ambiente no Vercel
echo    2. NEXT_PUBLIC_SUPABASE_URL
echo    3. NEXT_PUBLIC_SUPABASE_ANON_KEY
echo    4. SUPABASE_SERVICE_ROLE_KEY
echo.
echo 📋 TESTE:
echo    1. Acesse a URL fornecida
echo    2. Teste o login
echo    3. Vá em /gestao-areas/grupos
echo    4. Teste "+ Cromo de Galvonoplastia"
echo.
echo 🎉 APLICAÇÃO NO AR!
echo.
pause
