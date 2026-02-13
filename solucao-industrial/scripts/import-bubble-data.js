require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID da empresa (você precisa pegar o ID real da empresa que quer usar)
const COMPANY_ID = 'COLE_AQUI_O_ID_DA_EMPRESA'; // Substitua pelo ID real

/**
 * INSTRUÇÕES DE USO:
 *
 * 1. Acesse o Bubble.io e exporte os dados em JSON
 * 2. Cole os dados JSON nas variáveis abaixo
 * 3. Execute: node scripts/import-bubble-data.js
 */

// COLE AQUI OS DADOS DO BUBBLE.IO
const bubbleData = {
  cargos: [
    // Exemplo:
    // { nome: 'Gerente', descricao: 'Gerente de produção' },
    // { nome: 'Operador', descricao: 'Operador de máquina' }
  ],

  encargos: [
    // Exemplo:
    // { nome: 'INSS', percentual: 20, descricao: 'INSS Patronal' },
    // { nome: 'FGTS', percentual: 8, descricao: 'FGTS' }
  ],

  production_lines: [
    // Exemplo:
    // { name: 'Linha 1', description: 'Linha de galvanoplastia', line_type: 'GALVANOPLASTIA', active: true },
    // { name: 'Linha 2', description: 'Linha de verniz', line_type: 'VERNIZ', active: true }
  ],

  products: [
    // Exemplo (precisa do ID da linha de produção):
    // { name: 'Sulfato de Cobre', price: 150.00, production_line_id: 'ID_DA_LINHA', published: true }
  ],

  groups: [
    // Exemplo:
    // { name: 'Grupo A', description: 'Peças tipo A' }
  ],

  pieces: [
    // Exemplo (precisa do ID do grupo se tiver):
    // { name: 'Peça 1', area_dm2: 10.5, weight_kg: 2.3, group_id: 'ID_DO_GRUPO' }
  ],

  employees: [
    // Exemplo (precisa do ID do cargo se tiver):
    // { nome: 'João Silva', cpf: '12345678900', email: 'joao@email.com', salario_base: 3000, cargo_id: 'ID_DO_CARGO', active: true }
  ]
};

async function importData() {
  try {
    console.log('🚀 Iniciando importação de dados do Bubble.io...\n');

    // 1. Importar Cargos
    if (bubbleData.cargos.length > 0) {
      console.log('📦 Importando Cargos...');
      const cargosToInsert = bubbleData.cargos.map(cargo => ({
        ...cargo,
        company_id: COMPANY_ID
      }));

      const { data: cargos, error: cargosError } = await supabase
        .from('cargos')
        .insert(cargosToInsert)
        .select();

      if (cargosError) throw cargosError;
      console.log(`✅ ${cargos.length} cargos importados`);
      console.log('   IDs:', cargos.map(c => ({ id: c.id, nome: c.nome })));
      console.log('');
    }

    // 2. Importar Encargos
    if (bubbleData.encargos.length > 0) {
      console.log('📦 Importando Encargos...');
      const encargosToInsert = bubbleData.encargos.map(encargo => ({
        ...encargo,
        company_id: COMPANY_ID
      }));

      const { data: encargos, error: encargosError } = await supabase
        .from('encargos')
        .insert(encargosToInsert)
        .select();

      if (encargosError) throw encargosError;
      console.log(`✅ ${encargos.length} encargos importados`);
      console.log('   IDs:', encargos.map(e => ({ id: e.id, nome: e.nome })));
      console.log('');
    }

    // 3. Importar Linhas de Produção
    if (bubbleData.production_lines.length > 0) {
      console.log('📦 Importando Linhas de Produção...');
      const linesToInsert = bubbleData.production_lines.map(line => ({
        ...line,
        company_id: COMPANY_ID
      }));

      const { data: lines, error: linesError } = await supabase
        .from('production_lines')
        .insert(linesToInsert)
        .select();

      if (linesError) throw linesError;
      console.log(`✅ ${lines.length} linhas de produção importadas`);
      console.log('   IDs:', lines.map(l => ({ id: l.id, name: l.name })));
      console.log('');
    }

    // 4. Importar Grupos
    if (bubbleData.groups.length > 0) {
      console.log('📦 Importando Grupos...');
      const groupsToInsert = bubbleData.groups.map(group => ({
        ...group,
        company_id: COMPANY_ID
      }));

      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .insert(groupsToInsert)
        .select();

      if (groupsError) throw groupsError;
      console.log(`✅ ${groups.length} grupos importados`);
      console.log('   IDs:', groups.map(g => ({ id: g.id, name: g.name })));
      console.log('');
    }

    // 5. Importar Produtos
    if (bubbleData.products.length > 0) {
      console.log('📦 Importando Produtos...');
      const productsToInsert = bubbleData.products.map(product => ({
        ...product,
        company_id: COMPANY_ID
      }));

      const { data: products, error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (productsError) throw productsError;
      console.log(`✅ ${products.length} produtos importados`);
      console.log('   IDs:', products.map(p => ({ id: p.id, name: p.name })));
      console.log('');
    }

    // 6. Importar Peças
    if (bubbleData.pieces.length > 0) {
      console.log('📦 Importando Peças...');
      const piecesToInsert = bubbleData.pieces.map(piece => ({
        ...piece,
        company_id: COMPANY_ID
      }));

      const { data: pieces, error: piecesError } = await supabase
        .from('pieces')
        .insert(piecesToInsert)
        .select();

      if (piecesError) throw piecesError;
      console.log(`✅ ${pieces.length} peças importadas`);
      console.log('   IDs:', pieces.map(p => ({ id: p.id, name: p.name })));
      console.log('');
    }

    // 7. Importar Funcionários
    if (bubbleData.employees.length > 0) {
      console.log('📦 Importando Funcionários...');
      const employeesToInsert = bubbleData.employees.map(employee => ({
        ...employee,
        company_id: COMPANY_ID
      }));

      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .insert(employeesToInsert)
        .select();

      if (employeesError) throw employeesError;
      console.log(`✅ ${employees.length} funcionários importados`);
      console.log('   IDs:', employees.map(e => ({ id: e.id, nome: e.nome })));
      console.log('');
    }

    console.log('🎉 Importação concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro durante importação:', error);
    process.exit(1);
  }
}

// Executar importação
importData();
