/**
 * Script para verificar usuários e suas empresas
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

async function checkUserCompany() {
  console.log('=== VERIFICAÇÃO DE USUÁRIOS E EMPRESAS ===\n');

  try {
    // 1. Listar todas as empresas
    console.log('📊 EMPRESAS CADASTRADAS\n');
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    companies.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   CNPJ: ${company.cnpj}`);
      console.log(`   Email: ${company.email || 'Não informado'}`);
      console.log(`   Ativa: ${company.active ? 'Sim' : 'Não'}`);
      console.log('');
    });

    // 2. Listar todos os perfis/usuários
    console.log('\n👥 USUÁRIOS CADASTRADOS\n');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado na tabela profiles');
    } else {
      for (const profile of profiles) {
        const company = companies.find(c => c.id === profile.company_id);

        console.log(`👤 ${profile.full_name}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Empresa: ${company?.name || 'Não vinculado'}`);
        console.log(`   Company ID: ${profile.company_id}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Ativo: ${profile.active ? 'Sim' : 'Não'}`);
        console.log('');
      }
    }

    // 3. Verificar usuários na autenticação
    console.log('\n🔐 USUÁRIOS NO AUTH (Supabase Auth)\n');
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log('⚠️  Não foi possível acessar usuários do Auth');
      console.log('   (Isso é normal se a SUPABASE_SERVICE_ROLE_KEY não tiver permissões completas)');
    } else if (authUsers && authUsers.users) {
      authUsers.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
        console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}`);
        console.log('');
      });
    }

    // 4. Resumo de dados por empresa
    console.log('\n📈 RESUMO DE DADOS POR EMPRESA\n');

    for (const company of companies) {
      console.log(`\n${company.name}:`);
      console.log('─'.repeat(50));

      // Contar linhas
      const { data: lines } = await supabase
        .from('production_lines')
        .select('id, name, line_type')
        .eq('company_id', company.id);

      console.log(`✓ Linhas de Produção: ${lines.length}`);
      if (lines.length > 0) {
        const galvano = lines.filter(l => l.line_type === 'GALVANOPLASTIA').length;
        const verniz = lines.filter(l => l.line_type === 'VERNIZ').length;
        console.log(`  - GALVANOPLASTIA: ${galvano}`);
        console.log(`  - VERNIZ: ${verniz}`);

        // Mostrar primeiras 5 linhas
        console.log('\n  Primeiras linhas:');
        lines.slice(0, 5).forEach(l => console.log(`    • ${l.name} (${l.line_type})`));
        if (lines.length > 5) console.log(`    ... e mais ${lines.length - 5} linhas`);
      }

      // Contar produtos
      const { data: products } = await supabase
        .from('chemical_products')
        .select('id')
        .eq('company_id', company.id);

      console.log(`\n✓ Produtos Químicos: ${products.length}`);

      // Contar lançamentos
      const { data: launches } = await supabase
        .from('chemical_product_launches')
        .select('custo_total')
        .eq('company_id', company.id);

      const totalCost = launches.reduce((sum, l) => sum + (l.custo_total || 0), 0);
      console.log(`✓ Lançamentos: ${launches.length}`);
      console.log(`✓ Custo Total: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

    // 5. Instruções para o usuário
    console.log('\n\n' + '='.repeat(70));
    console.log('COMO ACESSAR OS DADOS');
    console.log('='.repeat(70));
    console.log('\n1. VERIFIQUE qual empresa você está usando no login');
    console.log('   - Bognar (ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9)');
    console.log('   - Solução Global (ID: b3d594a0-2925-41d6-b1b5-b2aec57c4f3b)');

    console.log('\n2. ACESSE o Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/editor');

    console.log('\n3. VEJA as tabelas:');
    console.log('   - production_lines (Linhas de Produção)');
    console.log('   - chemical_products (Produtos Químicos)');
    console.log('   - chemical_product_launches (Lançamentos)');

    console.log('\n4. FILTRE por company_id para ver dados da sua empresa\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkUserCompany()
  .then(() => {
    console.log('\n✅ Verificação concluída!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
