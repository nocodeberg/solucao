const XLSX = require('xlsx');
const path = require('path');

// Caminho para o arquivo Excel
const excelPath = path.join(__dirname, '../../Modelo.xlsx');

try {
  // Ler o arquivo Excel
  const workbook = XLSX.readFile(excelPath);

  console.log('=== PLANILHAS DISPONÍVEIS ===');
  console.log(workbook.SheetNames.join(', '));
  console.log('\n');

  // Processar cada planilha
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n=== PLANILHA: ${sheetName} ===\n`);

    const worksheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Mostrar primeiras linhas
    console.log('Primeiras 10 linhas:');
    data.slice(0, 10).forEach((row, index) => {
      console.log(`Linha ${index + 1}:`, JSON.stringify(row));
    });

    console.log(`\nTotal de linhas: ${data.length}`);

    // Se tiver cabeçalhos, mostrar a estrutura
    if (data.length > 0) {
      const headers = data[0];
      console.log('\nCabeçalhos detectados:', headers);

      // Converter para objetos usando os cabeçalhos
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('\nPrimeiro registro como objeto:');
      console.log(JSON.stringify(jsonData[0], null, 2));
    }

    console.log('\n' + '='.repeat(50));
  });

} catch (error) {
  console.error('Erro ao ler arquivo Excel:', error.message);
  process.exit(1);
}
