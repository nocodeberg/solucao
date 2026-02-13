const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Tentar carregar dotenv
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

async function updateCompanyLogo() {
  try {
    console.log('🚀 Atualizando logo da empresa...\n');

    // 1. Buscar a empresa atual
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (fetchError) throw fetchError;
    if (!companies || companies.length === 0) {
      console.error('❌ Nenhuma empresa encontrada!');
      process.exit(1);
    }

    const company = companies[0];
    console.log(`📦 Empresa encontrada: ${company.name} (${company.id})\n`);

    // 2. Ler o arquivo de logo
    const logoPath = path.join(__dirname, '..', 'public', 'logos', 'bognar-logo.png');

    if (!fs.existsSync(logoPath)) {
      console.error('❌ Arquivo de logo não encontrado:', logoPath);
      console.log('\n💡 Certifique-se que o logo está em: public/logos/bognar-logo.png\n');
      process.exit(1);
    }

    const logoFile = fs.readFileSync(logoPath);
    console.log('✅ Logo carregado do arquivo\n');

    // 3. Upload para Supabase Storage
    const fileName = `company-logos/${company.id}/logo.png`;

    console.log('📤 Fazendo upload do logo para Supabase Storage...');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(fileName, logoFile, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erro ao fazer upload:', uploadError);

      // Tentar criar o bucket se não existir
      console.log('\n🔧 Tentando criar bucket "public"...');
      const { error: bucketError } = await supabase.storage.createBucket('public', {
        public: true
      });

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('❌ Erro ao criar bucket:', bucketError);
        throw bucketError;
      }

      // Tentar upload novamente
      const { data: retryData, error: retryError } = await supabase.storage
        .from('public')
        .upload(fileName, logoFile, {
          contentType: 'image/png',
          upsert: true
        });

      if (retryError) throw retryError;
      console.log('✅ Upload realizado com sucesso!\n');
    } else {
      console.log('✅ Upload realizado com sucesso!\n');
    }

    // 4. Obter URL pública do logo
    const { data: publicUrlData } = supabase.storage
      .from('public')
      .getPublicUrl(fileName);

    const logoUrl = publicUrlData.publicUrl;
    console.log('🔗 URL do logo:', logoUrl, '\n');

    // 5. Atualizar empresa com URL do logo
    console.log('💾 Atualizando empresa com URL do logo...');

    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: logoUrl })
      .eq('id', company.id);

    if (updateError) throw updateError;

    console.log('✅ Logo da empresa atualizado com sucesso!\n');

    console.log('📊 Resumo:');
    console.log(`   Empresa: ${company.name}`);
    console.log(`   Logo URL: ${logoUrl}`);
    console.log('');
    console.log('🎉 Pronto! O logo aparecerá no sistema.');
    console.log('💡 Recarregue a página no navegador (F5) para ver as mudanças.\n');

  } catch (error) {
    console.error('❌ Erro ao atualizar logo:', error);
    process.exit(1);
  }
}

// Executar
updateCompanyLogo();
