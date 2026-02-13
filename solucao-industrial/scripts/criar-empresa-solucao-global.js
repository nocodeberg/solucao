const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis do .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam credenciais do Supabase no .env.local');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[PRESENTE]' : '[AUSENTE]');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function criarEmpresa() {
  console.log('🚀 Criando empresa: Solução Global\n');

  try {
    // 1. Criar empresa
    console.log('📝 Criando registro da empresa...');
    const { data: empresa, error: empresaError } = await supabase
      .from('companies')
      .insert({
        name: 'Solução Global',
        cnpj: '11.222.333/0001-44',
        email: 'contato@solucaoglobal.com',
        phone: '(11) 98765-4321',
        active: true
      })
      .select()
      .single();

    if (empresaError) {
      console.error('❌ Erro ao criar empresa:', empresaError);
      return;
    }

    console.log('✅ Empresa criada com sucesso!');
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Nome: ${empresa.name}`);
    console.log(`   CNPJ: ${empresa.cnpj}\n`);

    const companyId = empresa.id;

    // 2. Criar linhas de produção
    console.log('📝 Criando linhas de produção...');
    const { data: linhas, error: linhasError } = await supabase
      .from('production_lines')
      .insert([
        { company_id: companyId, name: 'Pré-Tratamento', description: 'Linha de pré-tratamento de peças', active: true },
        { company_id: companyId, name: 'Cobre Alcalino', description: 'Banho de cobre alcalino', active: true },
        { company_id: companyId, name: 'Cobre Ácido', description: 'Banho de cobre ácido', active: true },
        { company_id: companyId, name: 'Níquel', description: 'Banho de níquel', active: true },
        { company_id: companyId, name: 'Cromo', description: 'Banho de cromo', active: true }
      ])
      .select();

    if (linhasError) {
      console.error('❌ Erro ao criar linhas:', linhasError);
    } else {
      console.log(`✅ ${linhas.length} linhas de produção criadas\n`);
    }

    // 3. Criar grupos
    console.log('📝 Criando grupos de acabamento...');
    const { data: grupos, error: gruposError } = await supabase
      .from('groups')
      .insert([
        { company_id: companyId, name: 'Cromo', description: 'Acabamento cromado' },
        { company_id: companyId, name: 'Cromo II', description: 'Acabamento cromado tipo II' },
        { company_id: companyId, name: 'Níquel Strike', description: 'Níquel de aderência' },
        { company_id: companyId, name: 'Verniz Cataforético Cobre', description: 'Verniz catódico sobre cobre' },
        { company_id: companyId, name: 'Verniz Cataforético Preto Fosco', description: 'Verniz preto fosco' },
        { company_id: companyId, name: 'Verniz Cataforético Preto Brilhante', description: 'Verniz preto brilhante' },
        { company_id: companyId, name: 'Verniz Cataforético Gold', description: 'Verniz dourado' },
        { company_id: companyId, name: 'Verniz Cataforético Champagne', description: 'Verniz champagne' },
        { company_id: companyId, name: 'Verniz Cataforético Grafite Onix', description: 'Verniz grafite' },
        { company_id: companyId, name: 'Verniz Imersão C', description: 'Verniz por imersão tipo C' }
      ])
      .select();

    if (gruposError) {
      console.error('❌ Erro ao criar grupos:', gruposError);
    } else {
      console.log(`✅ ${grupos.length} grupos criados\n`);
    }

    // 4. Criar cargos
    console.log('📝 Criando cargos...');
    const { data: cargos, error: cargosError } = await supabase
      .from('cargos')
      .insert([
        { company_id: companyId, name: 'Operador', description: 'Operador de produção' },
        { company_id: companyId, name: 'Líder', description: 'Líder de produção' },
        { company_id: companyId, name: 'Auxiliar', description: 'Auxiliar de produção' },
        { company_id: companyId, name: 'Supervisor', description: 'Supervisor de produção' },
        { company_id: companyId, name: 'Técnico Químico', description: 'Técnico químico analista' },
        { company_id: companyId, name: 'Auxiliar de Inspeção', description: 'Auxiliar de controle de qualidade' },
        { company_id: companyId, name: 'Auxiliar de Produção', description: 'Auxiliar geral' },
        { company_id: companyId, name: 'Assistente de Inspeção', description: 'Assistente de qualidade' },
        { company_id: companyId, name: 'Auxiliar de Inspeção Verniz', description: 'Auxiliar de verniz' },
        { company_id: companyId, name: 'Operador de Verniz', description: 'Operador especializado em verniz' }
      ])
      .select();

    if (cargosError) {
      console.error('❌ Erro ao criar cargos:', cargosError);
    } else {
      console.log(`✅ ${cargos.length} cargos criados\n`);
    }

    // 5. Verificar encargos (criados automaticamente pelo schema)
    console.log('📝 Verificando encargos...');
    const { data: encargos, error: encargosError } = await supabase
      .from('encargos')
      .select('*')
      .eq('company_id', companyId);

    if (encargosError) {
      console.error('❌ Erro ao buscar encargos:', encargosError);
    } else {
      console.log(`✅ ${encargos.length} encargos disponíveis\n`);
    }

    console.log('═══════════════════════════════════════════════');
    console.log('✅ EMPRESA CRIADA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n📋 Informações da empresa:`);
    console.log(`   Nome: ${empresa.name}`);
    console.log(`   CNPJ: ${empresa.cnpj}`);
    console.log(`   Email: ${empresa.email}`);
    console.log(`   Phone: ${empresa.phone}`);
    console.log(`   ID: ${empresa.id}`);
    console.log(`\n📊 Dados iniciais:`);
    console.log(`   - ${linhas?.length || 0} linhas de produção`);
    console.log(`   - ${grupos?.length || 0} grupos de acabamento`);
    console.log(`   - ${cargos?.length || 0} cargos`);
    console.log(`   - ${encargos?.length || 0} encargos trabalhistas`);
    console.log(`\n⚠️  PRÓXIMO PASSO:`);
    console.log(`   Para criar um usuário admin para esta empresa:`);
    console.log(`   1. Registre um novo usuário no sistema`);
    console.log(`   2. Execute no SQL Editor do Supabase:`);
    console.log(`      UPDATE profiles SET company_id = '${companyId}', role = 'ADMIN'`);
    console.log(`      WHERE email = 'seu-email@exemplo.com';`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

criarEmpresa();
