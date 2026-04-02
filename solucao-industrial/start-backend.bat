@echo off
REM 🚀 SCRIPT PARA INICIAR BACKEND

echo 🚀 Iniciando backend da Solução Industrial...
echo.

REM Navegar até a pasta do server
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"

REM Verificar se node_modules existe
if not exist node_modules (
    echo 📦 Instalando dependências do backend...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências do backend
        pause
        exit /b 1
    )
    echo ✅ Dependências do backend instaladas
) else (
    echo ✅ Dependências do backend já instaladas
)

echo.
echo 🚀 Iniciando servidor backend...
echo 📍 Porta: 3001
echo 🌐 API: http://localhost:3001
echo 🏥 Health: http://localhost:3001/health
echo 🧪 Teste: http://localhost:3001/api/test
echo.
echo ⚠️ Mantenha esta janela aberta para o backend continuar rodando
echo ⚠️ Para parar: Ctrl+C
echo.

REM Iniciar o servidor
call npm run dev

REM Se o script terminar, mostrar mensagem
echo.
echo ❌ Servidor backend parado
pause
