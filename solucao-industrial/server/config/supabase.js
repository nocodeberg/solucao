const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase com service role (acesso total, apenas backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Função auxiliar para retry automático com timeout maior
async function withRetry(operation, maxRetries = 3, delayMs = 1500) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Adiciona timeout de 45 segundos para a operação
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), 45000)
        )
      ]);
      return result;
    } catch (error) {
      lastError = error;

      // Log do erro
      console.error(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message);

      // Se não for erro de timeout/rede, não tenta novamente
      const isNetworkError =
        error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.message === 'fetch failed' ||
        error.message === 'Operation timeout';

      if (!isNetworkError) {
        throw error;
      }

      // Aguarda antes de tentar novamente (com backoff exponencial)
      if (attempt < maxRetries) {
        const delay = delayMs * attempt;
        console.log(`Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`Todas as ${maxRetries} tentativas falharam. Último erro:`, lastError.message);
  throw lastError;
}

module.exports = supabase;
module.exports.withRetry = withRetry;
