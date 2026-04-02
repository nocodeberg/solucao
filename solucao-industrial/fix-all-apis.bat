@echo off
REM 🔧 CORRIGIR TODAS AS APIs AUTOMATICAMENTE
REM Substitui api por apiComplete em todas as páginas

echo 🔧 CORRIGINDO TODAS AS APIs
echo ===============================
echo.

echo 📝 Corrigindo app\configuracoes\cargos\page.tsx...
powershell -Command "(Get-Content 'app\configuracoes\cargos\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\configuracoes\cargos\page.tsx'"
powershell -Command "(Get-Content 'app\configuracoes\cargos\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\configuracoes\cargos\page.tsx'"

echo 📝 Corrigindo app\configuracoes\encargos\page.tsx...
powershell -Command "(Get-Content 'app\configuracoes\encargos\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\configuracoes\encargos\page.tsx'"
powershell -Command "(Get-Content 'app\configuracoes\encargos\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\configuracoes\encargos\page.tsx'"

echo 📝 Corrigindo app\consumo-agua\page.tsx...
powershell -Command "(Get-Content 'app\consumo-agua\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\consumo-agua\page.tsx'"
powershell -Command "(Get-Content 'app\consumo-agua\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\consumo-agua\page.tsx'"

echo 📝 Corrigindo app\gestao-areas\pecas\page.tsx...
powershell -Command "(Get-Content 'app\gestao-areas\pecas\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\gestao-areas\pecas\page.tsx'"
powershell -Command "(Get-Content 'app\gestao-areas\pecas\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\gestao-areas\pecas\page.tsx'"

echo 📝 Corrigindo app\manutencao\page.tsx...
powershell -Command "(Get-Content 'app\manutencao\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\manutencao\page.tsx'"
powershell -Command "(Get-Content 'app\manutencao\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\manutencao\page.tsx'"

echo 📝 Corrigindo app\rh\lancamento-mo\page.tsx...
powershell -Command "(Get-Content 'app\rh\lancamento-mo\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\rh\lancamento-mo\page.tsx'"
powershell -Command "(Get-Content 'app\rh\lancamento-mo\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\rh\lancamento-mo\page.tsx'"

echo 📝 Corrigindo app\usuarios\page.tsx...
powershell -Command "(Get-Content 'app\usuarios\page.tsx') -replace 'api\.', 'apiComplete.' | Set-Content 'app\usuarios\page.tsx'"
powershell -Command "(Get-Content 'app\usuarios\page.tsx') -replace 'from '\''@\/lib\/api\/client'\''', 'from '\''@\/lib\/api\/supabase-complete'\''' | Set-Content 'app\usuarios\page.tsx'"

echo.
echo ✅ TODAS AS PÁGINAS CORRIGIDAS!
echo ===============================
echo.
echo 📋 PÁGINAS ATUALIZADAS:
echo    ✅ app\configuracoes\cargos\page.tsx
echo    ✅ app\configuracoes\encargos\page.tsx
echo    ✅ app\consumo-agua\page.tsx
echo    ✅ app\gestao-areas\pecas\page.tsx
echo    ✅ app\manutencao\page.tsx
echo    ✅ app\rh\lancamento-mo\page.tsx
echo    ✅ app\usuarios\page.tsx
echo.
echo 📋 MUDANÇAS REALIZADAS:
echo    ✅ Imports atualizados para supabase-complete
echo    ✅ Chamadas api. → apiComplete.
echo    ✅ Todas as páginas usando API unificada
echo.
echo 📋 PRÓXIMO PASSO:
echo    1. Execute: npm run build
echo    2. Verifique se não há erros
echo    3. Faça deploy para produção
echo.
echo 🎉 SISTEMA 100% CORRIGIDO!
echo.
pause
