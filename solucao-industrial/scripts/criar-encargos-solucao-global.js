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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const companyId = 'b3d594a0-2925-41d6-b1b5-b2aec57c4f3b'; // Solução Global

async function criarEncargos() {
  console.log('📝 Criando encargos trabalhistas para Solução Global...\n');

  const { data, error } = await supabase
    .from('encargos')
    .insert([
      { company_id: companyId, name: 'INSS', value: 10.00, is_percentage: true, description: 'Contribuição INSS' },
      { company_id: companyId, name: 'FGTS', value: 8.00, is_percentage: true, description: 'Fundo de Garantia' },
      { company_id: companyId, name: 'Férias', value: 12.00, is_percentage: true, description: 'Provisão de Férias (1/12)' },
      { company_id: companyId, name: '1/3 Férias', value: 3.00, is_percentage: true, description: '1/3 sobre Férias' },
      { company_id: companyId, name: '13º Salário', value: 12.00, is_percentage: true, description: '13º Salário (1/12)' },
      { company_id: companyId, name: 'Insalubridade', value: 20.00, is_percentage: true, description: 'Adicional de Insalubridade' }
    ])
    .select();

  if (error) {
    console.error('❌ Erro ao criar encargos:', error);
    return;
  }

  console.log('✅ Encargos criados com sucesso!');
  console.log(`   Total: ${data.length} encargos\n`);

  data.forEach(encargo => {
    console.log(`   - ${encargo.name}: ${encargo.value}%`);
  });
}

criarEncargos();
