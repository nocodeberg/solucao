# DEPLOY FINAL - PowerShell Script
# Versao estavel para PowerShell

Write-Host "DEPLOY FINAL - SOLUCAO INDUSTRIAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1) Limpar build anterior
Write-Host "Limpando build anterior..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host ".next removido" -ForegroundColor Green
} else {
    Write-Host ".next nao existe" -ForegroundColor Green
}

# 2) Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install --force
Write-Host "Dependencias instaladas" -ForegroundColor Green

# 3) Build para producao
Write-Host "Buildando para producao..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build falhou" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
} else {
    Write-Host "Build OK" -ForegroundColor Green
}

# 4) Verificar build
if (-not (Test-Path ".next")) {
    Write-Host "Build nao foi criado" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "Build verificado" -ForegroundColor Green

# 5) Verificar Vercel CLI
Write-Host "Verificando Vercel CLI..." -ForegroundColor Yellow
try {
    vercel --version | Out-Null
    Write-Host "Vercel CLI ja instalado" -ForegroundColor Green
} catch {
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# 6) Fazer deploy
Write-Host "Fazendo deploy para Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Configure as variaveis de ambiente quando solicitado:" -ForegroundColor Cyan
Write-Host " - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Cyan
Write-Host " - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Cyan
Write-Host " - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
Write-Host ""

vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy falhou" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "DEPLOY CONCLUIDO COM SUCESSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Pressione Enter para sair"
