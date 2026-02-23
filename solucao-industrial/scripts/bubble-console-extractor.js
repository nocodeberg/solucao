/**
 * SCRIPT PARA EXECUTAR NO CONSOLE DO BUBBLE.IO
 *
 * COMO USAR:
 * 1. Abra https://bubble.io/page?id=solucaoindustrial&tab=Data
 * 2. Pressione F12 para abrir Developer Tools
 * 3. Vá na aba "Console"
 * 4. Cole ESTE SCRIPT COMPLETO e pressione Enter
 * 5. Copie o resultado JSON que aparecer
 * 6. Cole no arquivo import-bubble-data.js
 */

(async function extractBubbleData() {
  console.log('🚀 Iniciando extração de dados do Bubble.io...\n');

  // Função auxiliar para fazer requisições ao Bubble API
  async function fetchBubbleData(type) {
    try {
      const response = await fetch(`/version-test/api/1.1/obj/${type}`, {
        headers: {
          'Authorization': `Bearer ${window.bubble_plp_token || ''}`
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Erro ao buscar ${type}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.response?.results || [];
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar ${type}:`, error.message);
      return [];
    }
  }

  // Tipos de dados para extrair
  const types = [
    'cargos',
    'encargos',
    'production_lines',
    'products',
    'groups',
    'pieces',
    'employees',
    'user'
  ];

  const extractedData = {};

  // Extrair cada tipo
  for (const type of types) {
    console.log(`📦 Extraindo ${type}...`);
    const data = await fetchBubbleData(type);
    extractedData[type] = data;
    console.log(`   ✅ ${data.length} registros encontrados`);
  }

  console.log('\n✅ Extração concluída!\n');
  console.log('📋 COPIE O JSON ABAIXO:\n');
  console.log('==================== INÍCIO ====================');
  console.log(JSON.stringify(extractedData, null, 2));
  console.log('==================== FIM ====================\n');

  console.log('💡 Agora:');
  console.log('1. Copie TODO o JSON acima (entre INÍCIO e FIM)');
  console.log('2. Salve em um arquivo bubble-data.json');
  console.log('3. Execute: node scripts/process-bubble-export.js');

  return extractedData;
})();
