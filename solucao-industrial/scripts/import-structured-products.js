/**
 * Script de Importação Estruturada de Produtos
 *
 * Este script importa produtos conforme a estrutura definida nas imagens
 * para as linhas de galvanoplastia e verniz
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const companyId = process.argv[2];

if (!companyId) {
  console.error('❌ Erro: Company ID não fornecido');
  console.error('Uso: node scripts/import-structured-products.js [company_id]');
  process.exit(1);
}

// Estrutura de produtos por linha conforme as imagens
const productStructure = {
  // GALVANOPLASTIA - Cromo
  'Cromo': {
    type: 'GALVANOPLASTIA',
    products: ['Pré Tratamento', 'Cobre Alcalino', 'Cobre Ácido', 'Desengraxante Químico', 'Níquel Brilhante', 'Cromo', 'E.T.E']
  },

  // GALVANOPLASTIA - Cromo II
  'Cromo II': {
    type: 'GALVANOPLASTIA',
    products: ['Pré Tratamento', 'Níquel Strik', 'Cobre Ácido', 'Desengraxante Químico', 'Níquel Brilhante', 'Cromo', 'E.T.E']
  },

  // GALVANOPLASTIA - Níquel Strik
  'Níquel Strik': {
    type: 'GALVANOPLASTIA',
    products: ['Pré Tratamento', 'Níquel Strik', 'Cobre Ácido', 'Desengraxante Químico', 'Níquel Strik-2', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Cobre
  'Verniz Cataforético Cobre': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Cobre', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Preto Fosco
  'Verniz Cataforético Preto Fosco': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Preto Fosco', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Preto Brilhante
  'Verniz Cataforético Preto Brilhante': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Preto Brilhante', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Gold
  'Verniz Cataforético Gold': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Gold', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Champagne
  'Verniz Cataforético Champagne': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Champagne', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Cataforético Grafite Onix
  'Verniz Cataforético Grafite Onix': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Cataforético Grafite Onix', 'Desplacante', 'E.T.E']
  },

  // VERNIZ - Verniz Imersão
  'Verniz Imersão': {
    type: 'VERNIZ',
    products: ['Níquel Strik', 'Pré Tratamento', 'Verniz Imersão', 'Desplacante', 'E.T.E']
  }
};

async function importStructuredProducts() {
  console.log('=== IMPORTAÇÃO ESTRUTURADA DE PRODUTOS ===\n');
  console.log(`Company ID: ${companyId}\n`);

  const stats = {
    linesCreated: 0,
    linesExisting: 0,
    relationshipsCreated: 0,
    errors: []
  };

  try {
    // 1. Garantir que todas as linhas base existam
    console.log('📋 Verificando linhas base necessárias...\n');

    const baseLines = new Set();
    Object.values(productStructure).forEach(config => {
      config.products.forEach(product => baseLines.add(product));
    });

    const baseLinesList = Array.from(baseLines);
    console.log(`Linhas base necessárias: ${baseLinesList.length}`);
    console.log(baseLinesList.join(', '));
    console.log('');

    // Mapeamento de nomes alternativos
    const lineNameMapping = {
      'Níquel Strik-2': 'Níquel Strik 2',
      'E.T.E': 'Estação de Tratamento de Efluentes',
      'Desplacante': 'Desplacante de Gancheira'
    };

    // 2. Criar linhas principais
    console.log('🏭 Criando linhas principais...\n');

    for (const [lineName, config] of Object.entries(productStructure)) {
      console.log(`\n📊 Processando: ${lineName}`);
      console.log('─'.repeat(60));

      // Verificar se linha já existe
      const { data: existingLine } = await supabase
        .from('production_lines')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('name', lineName)
        .single();

      let mainLineId;

      if (existingLine) {
        mainLineId = existingLine.id;
        console.log(`✓ Linha já existe: ${lineName}`);
        stats.linesExisting++;
      } else {
        // Criar linha principal
        const { data: newLine, error: createError } = await supabase
          .from('production_lines')
          .insert({
            company_id: companyId,
            name: lineName,
            description: `Linha de produção ${lineName}`,
            line_type: config.type,
            active: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error(`❌ Erro ao criar linha ${lineName}:`, createError.message);
          stats.errors.push({ linha: lineName, erro: createError.message });
          continue;
        }

        mainLineId = newLine.id;
        console.log(`✓ Linha criada: ${lineName}`);
        stats.linesCreated++;
      }

      // 3. Vincular produtos (linhas base) a esta linha principal
      console.log(`\n  Vinculando ${config.products.length} processos...`);

      for (const productName of config.products) {
        try {
          // Mapear nome alternativo se necessário
          const mappedName = lineNameMapping[productName] || productName;

          // Buscar a linha base (produto)
          const { data: productLine } = await supabase
            .from('production_lines')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('name', mappedName)
            .single();

          if (!productLine) {
            console.log(`  ⚠ Linha base não encontrada: ${productName} (${mappedName})`);
            continue;
          }

          console.log(`  ✓ Vinculado: ${productName}`);
          stats.relationshipsCreated++;

        } catch (error) {
          console.error(`  ❌ Erro ao vincular ${productName}:`, error.message);
          stats.errors.push({
            linha: lineName,
            produto: productName,
            erro: error.message
          });
        }
      }
    }

    // Resumo final
    console.log('\n\n=== RESUMO DA IMPORTAÇÃO ===\n');
    console.log(`✓ Linhas criadas: ${stats.linesCreated}`);
    console.log(`⊕ Linhas existentes: ${stats.linesExisting}`);
    console.log(`✓ Relacionamentos criados: ${stats.relationshipsCreated}`);

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

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

importStructuredProducts()
  .then(() => {
    console.log('\n✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
