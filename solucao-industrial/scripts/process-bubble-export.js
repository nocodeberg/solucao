const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Tentar carregar dotenv, senão usar variáveis de ambiente diretas
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('⚠️ dotenv não encontrado, usando variáveis de ambiente do sistema');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Leia o arquivo bubble-data.json
const bubbleDataPath = path.join(__dirname, 'bubble-data.json');

if (!fs.existsSync(bubbleDataPath)) {
  console.error('❌ Erro: Arquivo bubble-data.json não encontrado!');
  console.log('\n📝 Instruções:');
  console.log('1. Execute o script bubble-console-extractor.js no console do Bubble');
  console.log('2. Copie o JSON gerado');
  console.log('3. Salve como: scripts/bubble-data.json');
  console.log('4. Execute novamente: node scripts/process-bubble-export.js\n');
  process.exit(1);
}

const bubbleData = JSON.parse(fs.readFileSync(bubbleDataPath, 'utf-8'));

// ID da empresa (será criado automaticamente se não existir)
let COMPANY_ID = null;

async function getOrCreateCompany() {
  console.log('🏢 Verificando empresa...');

  // Tentar buscar empresa existente
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1);

  if (existingCompanies && existingCompanies.length > 0) {
    COMPANY_ID = existingCompanies[0].id;
    console.log(`✅ Usando empresa existente: ${existingCompanies[0].name} (${COMPANY_ID})\n`);
    return COMPANY_ID;
  }

  // Criar nova empresa
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      name: 'Solução Industrial',
      cnpj: '00.000.000/0001-00',
      email: 'contato@solucaoindustrial.com.br',
      active: true
    })
    .select()
    .single();

  if (error) throw error;

  COMPANY_ID = newCompany.id;
  console.log(`✅ Empresa criada: ${newCompany.name} (${COMPANY_ID})\n`);
  return COMPANY_ID;
}

async function importData() {
  try {
    console.log('🚀 Iniciando importação de dados do Bubble.io para Supabase...\n');

    // 1. Obter ou criar empresa
    await getOrCreateCompany();

    // 2. Importar Cargos
    if (bubbleData.cargos && bubbleData.cargos.length > 0) {
      console.log('📦 Importando Cargos...');
      const cargosToInsert = bubbleData.cargos.map(cargo => ({
        name: cargo.name || cargo.nome,
        description: cargo.description || cargo.descricao || '',
        company_id: COMPANY_ID
      }));

      const { data: cargos, error } = await supabase
        .from('cargos')
        .insert(cargosToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar cargos:', error);
      } else {
        console.log(`✅ ${cargos.length} cargos importados`);
        console.log('   Exemplos:', cargos.slice(0, 3).map(c => c.name).join(', '));
      }
      console.log('');
    }

    // 3. Importar Encargos
    if (bubbleData.encargos && bubbleData.encargos.length > 0) {
      console.log('📦 Importando Encargos...');
      const encargosToInsert = bubbleData.encargos.map(encargo => ({
        name: encargo.name || encargo.nome,
        value: encargo.percentual || encargo.percentage || encargo.value || 0,
        is_percentage: true,
        description: encargo.description || encargo.descricao || '',
        company_id: COMPANY_ID
      }));

      const { data: encargos, error } = await supabase
        .from('encargos')
        .insert(encargosToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar encargos:', error);
      } else {
        console.log(`✅ ${encargos.length} encargos importados`);
        console.log('   Exemplos:', encargos.slice(0, 3).map(e => `${e.name} (${e.value}%)`).join(', '));
      }
      console.log('');
    }

    // 4. Importar Linhas de Produção
    const lineIdMap = {};
    if (bubbleData.production_lines && bubbleData.production_lines.length > 0) {
      console.log('📦 Importando Linhas de Produção...');
      const linesToInsert = bubbleData.production_lines.map(line => ({
        name: line.name || line.nome,
        description: line.description || line.descricao || '',
        line_type: line.line_type || line.tipo || 'GALVANOPLASTIA',
        active: line.active !== undefined ? line.active : true,
        company_id: COMPANY_ID
      }));

      const { data: lines, error } = await supabase
        .from('production_lines')
        .insert(linesToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar linhas:', error);
      } else {
        console.log(`✅ ${lines.length} linhas de produção importadas`);
        lines.forEach((line, idx) => {
          const originalLine = bubbleData.production_lines[idx];
          lineIdMap[originalLine._id || originalLine.name] = line.id;
          console.log(`   - ${line.name} [${line.line_type}]`);
        });
      }
      console.log('');
    }

    // 5. Importar Grupos
    const groupIdMap = {};
    if (bubbleData.groups && bubbleData.groups.length > 0) {
      console.log('📦 Importando Grupos...');
      const groupsToInsert = bubbleData.groups.map(group => ({
        name: group.name || group.nome,
        description: group.description || group.descricao || '',
        company_id: COMPANY_ID
      }));

      const { data: groups, error } = await supabase
        .from('groups')
        .insert(groupsToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar grupos:', error);
      } else {
        console.log(`✅ ${groups.length} grupos importados`);
        groups.forEach((group, idx) => {
          const originalGroup = bubbleData.groups[idx];
          groupIdMap[originalGroup._id || originalGroup.name] = group.id;
          console.log(`   - ${group.name}`);
        });
      }
      console.log('');
    }

    // 6. Importar Produtos
    if (bubbleData.products && bubbleData.products.length > 0) {
      console.log('📦 Importando Produtos...');
      const productsToInsert = bubbleData.products
        .filter(product => {
          const lineId = lineIdMap[product.production_line_id || product.linha_id];
          if (!lineId) {
            console.warn(`   ⚠️ Produto "${product.name}" sem linha de produção válida, ignorando`);
            return false;
          }
          return true;
        })
        .map(product => ({
          name: product.name || product.nome,
          price: parseFloat(product.price || product.preco || 0),
          production_line_id: lineIdMap[product.production_line_id || product.linha_id],
          published: product.published !== undefined ? product.published : true,
          company_id: COMPANY_ID
        }));

      if (productsToInsert.length > 0) {
        const { data: products, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();

        if (error) {
          console.error('❌ Erro ao importar produtos:', error);
        } else {
          console.log(`✅ ${products.length} produtos importados`);
          console.log('   Exemplos:', products.slice(0, 3).map(p => p.name).join(', '));
        }
      }
      console.log('');
    }

    // 7. Importar Peças
    if (bubbleData.pieces && bubbleData.pieces.length > 0) {
      console.log('📦 Importando Peças...');
      const piecesToInsert = bubbleData.pieces.map(piece => ({
        name: piece.name || piece.nome,
        area_dm2: parseFloat(piece.area_dm2 || piece.area || 0),
        weight_kg: parseFloat(piece.weight_kg || piece.peso || piece.weight || 0),
        group_id: groupIdMap[piece.group_id || piece.grupo_id] || null,
        production_type: piece.production_type || piece.tipo_producao || null,
        company_id: COMPANY_ID
      }));

      const { data: pieces, error } = await supabase
        .from('pieces')
        .insert(piecesToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar peças:', error);
      } else {
        console.log(`✅ ${pieces.length} peças importadas`);
        console.log('   Exemplos:', pieces.slice(0, 3).map(p => p.name).join(', '));
      }
      console.log('');
    }

    // 8. Importar Funcionários
    if (bubbleData.employees && bubbleData.employees.length > 0) {
      console.log('📦 Importando Funcionários...');

      // Buscar cargos para mapear
      const { data: cargosData } = await supabase
        .from('cargos')
        .select('id, name')
        .eq('company_id', COMPANY_ID);

      const cargoMap = {};
      if (cargosData) {
        cargosData.forEach(cargo => {
          cargoMap[cargo.name.toLowerCase()] = cargo.id;
        });
      }

      const employeesToInsert = bubbleData.employees.map(emp => ({
        full_name: emp.full_name || emp.nome || emp.name,
        cpf: emp.cpf || null,
        email: emp.email || null,
        phone: emp.phone || emp.telefone || null,
        salary: parseFloat(emp.salary || emp.salario_base || emp.salario || 0),
        cargo_id: cargoMap[emp.cargo?.toLowerCase()] || null,
        admission_date: emp.admission_date || emp.data_admissao || null,
        active: emp.active !== undefined ? emp.active : true,
        company_id: COMPANY_ID
      }));

      const { data: employees, error } = await supabase
        .from('employees')
        .insert(employeesToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao importar funcionários:', error);
      } else {
        console.log(`✅ ${employees.length} funcionários importados`);
        console.log('   Exemplos:', employees.slice(0, 3).map(e => e.full_name).join(', '));
      }
      console.log('');
    }

    console.log('🎉 Importação concluída com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - Cargos: ${bubbleData.cargos?.length || 0}`);
    console.log(`   - Encargos: ${bubbleData.encargos?.length || 0}`);
    console.log(`   - Linhas: ${bubbleData.production_lines?.length || 0}`);
    console.log(`   - Produtos: ${bubbleData.products?.length || 0}`);
    console.log(`   - Grupos: ${bubbleData.groups?.length || 0}`);
    console.log(`   - Peças: ${bubbleData.pieces?.length || 0}`);
    console.log(`   - Funcionários: ${bubbleData.employees?.length || 0}`);
    console.log('');
    console.log('✅ Acesse o sistema e verifique os dados!');

  } catch (error) {
    console.error('❌ Erro durante importação:', error);
    process.exit(1);
  }
}

// Executar importação
importData();
