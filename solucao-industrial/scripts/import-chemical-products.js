/**
 * Script de Importação de Produtos Químicos
 *
 * Este script importa os produtos químicos extraídos da planilha Modelo.xlsx
 * para o banco de dados Supabase.
 *
 * Uso: node scripts/import-chemical-products.js [company_id]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas');
  console.error('Configure as variáveis no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID da empresa (pode ser passado como argumento)
const companyId = process.argv[2];

if (!companyId) {
  console.error('❌ Erro: Company ID não fornecido');
  console.error('Uso: node scripts/import-chemical-products.js [company_id]');
  process.exit(1);
}

// Mapeamento de linhas
const lineMapping = {
  'Pré Tratamento': { name: 'Pré Tratamento', type: 'GALVANOPLASTIA', description: 'Linha de pré-tratamento de peças' },
  'Cobre Alcalino': { name: 'Cobre Alcalino', type: 'GALVANOPLASTIA', description: 'Linha de cobreação alcalina' },
  'Níquel Strik': { name: 'Níquel Strik', type: 'GALVANOPLASTIA', description: 'Linha de níquel strik' },
  'Cobre Ácido': { name: 'Cobre Ácido', type: 'GALVANOPLASTIA', description: 'Linha de cobreação ácida' },
  'Desengraxante Quí': { name: 'Desengraxante Químico', type: 'GALVANOPLASTIA', description: 'Linha de desengraxe químico' },
  'Níquel Brilhante': { name: 'Níquel Brilhante', type: 'GALVANOPLASTIA', description: 'Linha de níquel brilhante' },
  'Níquel Strik (2)': { name: 'Níquel Strik 2', type: 'GALVANOPLASTIA', description: 'Segunda linha de níquel strik' },
  'Cromo': { name: 'Cromo', type: 'GALVANOPLASTIA', description: 'Linha de cromação' },
  'Pré Tratamento Verniz': { name: 'Pré Tratamento Verniz', type: 'VERNIZ', description: 'Linha de pré-tratamento para verniz' },
  'Verniz Cataforético': { name: 'Verniz Cataforético', type: 'VERNIZ', description: 'Linha de verniz cataforético' },
  'Verniz Imersão': { name: 'Verniz Imersão', type: 'VERNIZ', description: 'Linha de verniz por imersão' },
  'Desplacante  ': { name: 'Desplacante', type: 'GALVANOPLASTIA', description: 'Linha de desplacante' },
  'Desplacante de gancheira ': { name: 'Desplacante de Gancheira', type: 'GALVANOPLASTIA', description: 'Linha de desplacante de gancheira' },
  'E.T.E': { name: 'Estação de Tratamento de Efluentes', type: 'GALVANOPLASTIA', description: 'Estação de tratamento de efluentes' }
};

async function importData() {
  console.log('=== IMPORTAÇÃO DE PRODUTOS QUÍMICOS ===\n');
  console.log(`Company ID: ${companyId}\n`);

  // Ler dados extraídos
  const dataPath = path.join(__dirname, '../data/produtos-quimicos-extraidos.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ Erro: Arquivo de dados não encontrado');
    console.error('Execute primeiro: node scripts/extract-product-data.js');
    process.exit(1);
  }

  const extractedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const stats = {
    linesCreated: 0,
    linesExisting: 0,
    productsCreated: 0,
    productsSkipped: 0,
    launchesCreated: 0,
    errors: []
  };

  // Processar cada linha
  for (const [sheetName, products] of Object.entries(extractedData)) {
    console.log(`\n📊 Processando: ${sheetName}`);
    console.log('─'.repeat(60));

    const lineConfig = lineMapping[sheetName];
    if (!lineConfig) {
      console.log('⚠ Linha não mapeada, pulando...');
      continue;
    }

    // 1. Criar ou obter linha de produção
    let productionLineId;

    try {
      // Verificar se linha já existe
      const { data: existingLine, error: checkError } = await supabase
        .from('production_lines')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', lineConfig.name)
        .single();

      if (existingLine) {
        productionLineId = existingLine.id;
        console.log(`✓ Linha já existe: ${lineConfig.name}`);
        stats.linesExisting++;
      } else {
        // Criar nova linha
        const { data: newLine, error: createError } = await supabase
          .from('production_lines')
          .insert({
            company_id: companyId,
            name: lineConfig.name,
            description: lineConfig.description,
            line_type: lineConfig.type,
            active: true
          })
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        productionLineId = newLine.id;
        console.log(`✓ Linha criada: ${lineConfig.name}`);
        stats.linesCreated++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${lineConfig.name}:`, error.message);
      stats.errors.push({ linha: lineConfig.name, erro: error.message });
      continue;
    }

    // 2. Importar produtos
    console.log(`\n  Importando ${products.length} produtos...`);

    for (const product of products) {
      try {
        // Limpar nome do produto
        const cleanName = product.nome.trim();

        // Verificar se produto já existe
        const { data: existingProduct } = await supabase
          .from('chemical_products')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', cleanName)
          .eq('production_line_id', productionLineId)
          .single();

        let chemicalProductId;

        if (existingProduct) {
          chemicalProductId = existingProduct.id;
          console.log(`  ⊕ Produto já existe: ${cleanName}`);
          stats.productsSkipped++;
        } else {
          // Criar produto
          const { data: newProduct, error: productError } = await supabase
            .from('chemical_products')
            .insert({
              company_id: companyId,
              production_line_id: productionLineId,
              name: cleanName,
              unit_price: product.custoMarco || 0,
              unit: 'Kg',
              active: true
            })
            .select('id')
            .single();

          if (productError) {
            throw productError;
          }

          chemicalProductId = newProduct.id;
          console.log(`  ✓ Produto criado: ${cleanName}`);
          stats.productsCreated++;
        }

        // 3. Criar lançamento de março (se houver dados)
        if (product.custoTotalMarco > 0) {
          const { error: launchError } = await supabase
            .from('chemical_product_launches')
            .insert({
              company_id: companyId,
              chemical_product_id: chemicalProductId,
              production_line_id: productionLineId,
              mes: 3,
              ano: 2024,
              quantidade: product.volumeTanque || 0,
              consumo: product.consumoMarco || 0,
              custo_unitario: product.custoMarco || 0,
              custo_total: product.custoTotalMarco || 0,
              observacao: 'Importado da planilha Modelo.xlsx'
            });

          if (!launchError) {
            stats.launchesCreated++;
          }
        }

      } catch (error) {
        console.error(`  ❌ Erro ao importar produto ${product.nome}:`, error.message);
        stats.errors.push({
          linha: lineConfig.name,
          produto: product.nome,
          erro: error.message
        });
      }
    }
  }

  // Exibir estatísticas finais
  console.log('\n\n=== RESUMO DA IMPORTAÇÃO ===\n');
  console.log(`✓ Linhas criadas: ${stats.linesCreated}`);
  console.log(`⊕ Linhas existentes: ${stats.linesExisting}`);
  console.log(`✓ Produtos criados: ${stats.productsCreated}`);
  console.log(`⊕ Produtos existentes (pulados): ${stats.productsSkipped}`);
  console.log(`✓ Lançamentos criados: ${stats.launchesCreated}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Erros encontrados: ${stats.errors.length}`);
    console.log('\nDetalhes dos erros:');
    stats.errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.linha}${err.produto ? ` - ${err.produto}` : ''}`);
      console.log(`   ${err.erro}`);
    });
  } else {
    console.log('\n✅ Importação concluída sem erros!');
  }
}

// Executar importação
importData()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
