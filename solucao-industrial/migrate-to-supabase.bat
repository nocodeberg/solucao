@echo off
REM 🔄 MIGRAÇÃO AUTOMÁTICA PARA SUPABASE
REM Substitui todas as chamadas da API backend pela API Supabase

echo 🔄 MIGRAÇÃO AUTOMÁTICA PARA SUPABASE
echo ====================================
echo.

echo 📋 Arquivos que serão migrados:
echo    app\gestao-areas\linhas\page.tsx
echo    app\rh\funcionarios\page.tsx
echo    app\configuracoes\cargos\page.tsx
echo    app\configuracoes\encargos\page.tsx
echo    app\usuarios\page.tsx
echo    app\manutencao\page.tsx
echo    app\consumo-agua\page.tsx
echo    app\rh\lancamento-mo\page.tsx
echo    app\gestao-areas\pecas\page.tsx
echo.

set /p confirm="Deseja continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo ❌ Migração cancelada
    pause
    exit /b 1
)

echo.
echo 🔧 Iniciando migração...

REM 1️⃣ Atualizar app\gestao-areas\linhas\page.tsx
echo 📝 Atualizando linhas\page.tsx...
powershell -Command "(Get-Content 'app\gestao-areas\linhas\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\gestao-areas\linhas\page.tsx'"
powershell -Command "(Get-Content 'app\gestao-areas\linhas\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\gestao-areas\linhas\page.tsx'"

REM 2️⃣ Atualizar app\rh\funcionarios\page.tsx
echo 📝 Atualizando funcionarios\page.tsx...
powershell -Command "(Get-Content 'app\rh\funcionarios\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\rh\funcionarios\page.tsx'"
powershell -Command "(Get-Content 'app\rh\funcionarios\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\rh\funcionarios\page.tsx'"

REM 3️⃣ Atualizar app\configuracoes\cargos\page.tsx
echo 📝 Atualizando cargos\page.tsx...
powershell -Command "(Get-Content 'app\configuracoes\cargos\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\configuracoes\cargos\page.tsx'"
powershell -Command "(Get-Content 'app\configuracoes\cargos\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\configuracoes\cargos\page.tsx'"

REM 4️⃣ Atualizar app\configuracoes\encargos\page.tsx
echo 📝 Atualizando encargos\page.tsx...
powershell -Command "(Get-Content 'app\configuracoes\encargos\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\configuracoes\encargos\page.tsx'"
powershell -Command "(Get-Content 'app\configuracoes\encargos\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\configuracoes\encargos\page.tsx'"

REM 5️⃣ Atualizar app\usuarios\page.tsx
echo 📝 Atualizando usuarios\page.tsx...
powershell -Command "(Get-Content 'app\usuarios\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\usuarios\page.tsx'"
powershell -Command "(Get-Content 'app\usuarios\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\usuarios\page.tsx'"

REM 6️⃣ Atualizar app\manutencao\page.tsx
echo 📝 Atualizando manutencao\page.tsx...
powershell -Command "(Get-Content 'app\manutencao\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\manutencao\page.tsx'"
powershell -Command "(Get-Content 'app\manutencao\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\manutencao\page.tsx'"

REM 7️⃣ Atualizar app\consumo-agua\page.tsx
echo 📝 Atualizando consumo-agua\page.tsx...
powershell -Command "(Get-Content 'app\consumo-agua\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\consumo-agua\page.tsx'"
powershell -Command "(Get-Content 'app\consumo-agua\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\consumo-agua\page.tsx'"

REM 8️⃣ Atualizar app\rh\lancamento-mo\page.tsx
echo 📝 Atualizando lancamento-mo\page.tsx...
powershell -Command "(Get-Content 'app\rh\lancamento-mo\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\rh\lancamento-mo\page.tsx'"
powershell -Command "(Get-Content 'app\rh\lancamento-mo\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\rh\lancamento-mo\page.tsx'"

REM 9️⃣ Atualizar app\gestao-areas\pecas\page.tsx
echo 📝 Atualizando pecas\page.tsx...
powershell -Command "(Get-Content 'app\gestao-areas\pecas\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\gestao-areas\pecas\page.tsx'"
powershell -Command "(Get-Content 'app\gestao-areas\pecas\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\gestao-areas\pecas\page.tsx'"

echo.
echo ✅ Migração concluída com sucesso!
echo ====================================
echo.
echo 📋 MUDANÇAS REALIZADAS:
echo    ✅ Imports atualizados para supabase-complete
echo    ✅ Chamadas da API substituídas (api. → apiComplete.)
echo    ✅ 9 páginas migradas
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Execute: npm run build
echo    2. Verifique se não há erros
echo    3. Faça deploy para produção
echo.
echo 📋 BENEFÍCIOS:
echo    ✅ Sem erro de conexão em produção
echo    ✅ API única e consistente
echo    ✅ Sem necessidade de backend
echo    ✅ Deploy simplificado
echo.
echo 🎉 SISTEMA MIGRADO PARA SUPABASE!
echo.
pause
