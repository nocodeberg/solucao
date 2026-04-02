const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo Excel
const excelPath = path.join(__dirname, '../../Modelo.xlsx');

// Nomes das planilhas de produtos químicos (linhas de produção)
const productSheets = [
  'Pré Tratamento',
  'Cobre Alcalino',
  'Níquel Strik',
  'Cobre Ácido',
  'Desengraxante Quí',
  'Níquel Brilhante',
  'Níquel Strik (2)',
  'Cromo',
  'Pré Tratamento Verniz',
  'Verniz Cataforético',
  'Verniz Imersão',
  'Desplacante  ',
  'Desplacante de gancheira ',
  'E.T.E'
];

try {
  const workbook = XLSX.readFile(excelPath);
  const extractedData = {};

  console.log('=== EXTRAÇÃO DE DADOS DE PRODUTOS QUÍMICOS ===\n');

  productSheets.forEach((sheetName) => {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`⚠ Planilha "${sheetName}" não encontrada`);
      return;
    }

    console.log(`\n📊 Processando: ${sheetName}`);
    console.log('─'.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    // Encontrar linha de cabeçalhos (procurar por "Produto")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      if (data[i] && data[i][0] === 'Produto') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log('❌ Cabeçalho não encontrado');
      return;
    }

    const headers = data[headerRowIndex];
    console.log(`\n✓ Cabeçalhos encontrados na linha ${headerRowIndex + 1}`);
    console.log('Colunas principais:', headers.slice(0, 7).join(' | '));

    // Extrair dados dos produtos
    const products = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];

      // Pular linhas vazias
      if (!row || !row[0] || row[0].toString().trim() === '') continue;

      // Extrair dados básicos do produto
      const product = {
        nome: row[0],
        id: row[1],
        volumeTanque: row[2],
        concentracao: row[3],
        // Dados do mês de março (colunas 10-12 normalmente)
        consumoMarco: row[10] || 0,
        custoMarco: row[11] || 0,
        custoTotalMarco: row[12] || 0
      };

      products.push(product);
    }

    console.log(`\n📦 Total de produtos encontrados: ${products.length}`);

    if (products.length > 0) {
      console.log('\nPrimeiros 3 produtos:');
      products.slice(0, 3).forEach((p, idx) => {
        console.log(`\n  ${idx + 1}. ${p.nome}`);
        console.log(`     ID: ${p.id || 'N/A'}`);
        console.log(`     Volume: ${p.volumeTanque} lts`);
        console.log(`     Concentração: ${p.concentracao}`);
        console.log(`     Consumo (Mar): ${p.consumoMarco} Kg/lt`);
        console.log(`     Custo (Mar): R$ ${p.custoMarco}/Kg`);
        console.log(`     Custo Total (Mar): R$ ${p.custoTotalMarco}`);
      });
    }

    extractedData[sheetName] = products;
  });

  // Salvar dados extraídos em JSON
  const outputPath = path.join(__dirname, '../data/produtos-quimicos-extraidos.json');

  // Criar diretório data se não existir
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2), 'utf8');

  console.log('\n\n✅ Dados extraídos com sucesso!');
  console.log(`📁 Arquivo salvo em: ${outputPath}`);

  // Estatísticas gerais
  console.log('\n=== RESUMO GERAL ===');
  let totalProducts = 0;
  Object.keys(extractedData).forEach(linha => {
    const count = extractedData[linha].length;
    totalProducts += count;
    console.log(`  ${linha}: ${count} produtos`);
  });
  console.log(`\n  TOTAL: ${totalProducts} produtos químicos`);

} catch (error) {
  console.error('❌ Erro ao processar arquivo Excel:', error.message);
  console.error(error.stack);
  process.exit(1);
}
