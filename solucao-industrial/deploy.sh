#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO
# Solução Industrial - Deploy para Produção

echo "🚀 Iniciando deploy da Solução Industrial..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ERRO: $1${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $1${NC}"
    fi
}

# 1️⃣ Limpar builds anteriores
echo -e "${YELLOW}🧹 Limpando builds anteriores...${NC}"
rm -rf .next
check_error "Limpeza do .next"

# 2️⃣ Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install
check_error "Instalação de dependências"

# 3️⃣ Type checking
echo -e "${YELLOW}🔍 Verificando tipos TypeScript...${NC}"
npm run type-check
check_error "TypeScript type checking"

# 4️⃣ Linting
echo -e "${YELLOW}🔧 Executando linting...${NC}"
npm run lint:fix
check_error "Linting e correções"

# 5️⃣ Build
echo -e "${YELLOW}🏗️ Construindo aplicação...${NC}"
npm run build
check_error "Build da aplicação"

# 6️⃣ Verificar build
echo -e "${YELLOW}📋 Verificando build...${NC}"
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build gerado com sucesso${NC}"
    echo -e "${YELLOW}📊 Tamanho do build:${NC}"
    du -sh .next
else
    echo -e "${RED}❌ Build não foi gerado${NC}"
    exit 1
fi

# 7️⃣ Testar em modo produção (local)
echo -e "${YELLOW}🧪 Testando em modo produção...${NC}"
npm start &
PID=$!
sleep 5
if kill -0 $PID 2>/dev/null; then
    echo -e "${GREEN}✅ Aplicação iniciou em modo produção${NC}"
    kill $PID
else
    echo -e "${RED}❌ Falha ao iniciar em modo produção${NC}"
    exit 1
fi

# 8️⃣ Resumo do deploy
echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${YELLOW}📋 Resumo:${NC}"
echo -e "  • TypeScript: ✅"
echo -e "  • Linting: ✅"
echo -e "  • Build: ✅"
echo -e "  • Teste produção: ✅"
echo -e ""
echo -e "${YELLOW}🚀 Para iniciar em produção:${NC}"
echo -e "  npm start"
echo -e ""
echo -e "${YELLOW}🌐 Acessar em:${NC}"
echo -e "  http://localhost:3000"

# 9️⃣ Opcional: Deploy para servidor
read -p "Deseja fazer deploy para servidor? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Fazendo deploy para servidor...${NC}"
    # Adicionar comandos de deploy para seu servidor aqui
    # Ex: rsync, scp, docker, etc.
    echo -e "${YELLOW}⚠️ Configurar comandos de deploy para servidor${NC}"
fi

echo -e "${GREEN}✨ Deploy finalizado!${NC}"
