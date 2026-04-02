@echo off
REM 🚀 SCRIPT PARA INICIAR TODOS OS SERVIDORES

echo 🚀 Iniciando Sistema Completo da Solução Industrial
echo ============================================
echo.

REM Iniciar Backend
echo 🔌 Iniciando Backend (Porta 3001)...
start "Backend - Solução Industrial" cmd /k "cd /d \"c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server\" && start-backend.bat"

REM Esperar 3 segundos para o backend iniciar
timeout /t 3 /nobreak > nul

REM Iniciar Frontend
echo 🌐 Iniciando Frontend (Porta 3000)...
start "Frontend - Solução Industrial" cmd /k "cd /d \"c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\" && npm run dev"

echo.
echo ✅ SISTEMA INICIADO COM SUCESSO!
echo ============================================
echo.
echo 📋 SERVIÇOS DISPONÍVEIS:
echo    🌐 Frontend: http://localhost:3000
echo    🔌 Backend:  http://localhost:3001
echo    🏥 Health:   http://localhost:3001/health
echo    🧪 Teste:    http://localhost:3001/api/test
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Aguarde 10 segundos para os serviços iniciarem
echo    2. Acesse: http://localhost:3000
echo    3. Teste o login
echo    4. Acesse: http://localhost:3000/gestao-areas/grupos
echo.
echo 📋 PARA PARAR OS SERVIÇOS:
echo    Feche as janelas do terminal ou aperte Ctrl+C
echo.
echo 📋 SE DER ERRO 404:
echo    1. Verifique se o backend iniciou (janela "Backend")
echo    2. Verifique se aparece "🚀 Servidor backend rodando"
echo    3. Teste: http://localhost:3001/api/test
echo.
echo ⏳ Aguardando 3 segundos antes de abrir o navegador...
timeout /t 3 /nobreak > nul

REM Abrir navegador automaticamente
start http://localhost:3000

echo.
echo 🎉 Sistema pronto para uso!
echo.
pause
