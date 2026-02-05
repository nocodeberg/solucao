export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// =====================================================
// FORMATAÇÃO DE MOEDA (BRL)
// =====================================================

export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove tudo exceto números, vírgula e ponto
  const cleaned = value.replace(/[^\d,.-]/g, '');

  // Substitui vírgula por ponto para conversão
  const normalized = cleaned.replace(',', '.');

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function maskCurrency(value: string): string {
  if (!value) return '';

  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');

  if (!numbers) return '';

  // Converte para número e formata
  const amount = parseFloat(numbers) / 100;

  return formatCurrency(amount);
}

// =====================================================
// FORMATAÇÃO DE DATA
// =====================================================

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function maskDate(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');

  // Aplica máscara DD/MM/AAAA
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Tenta parser DD/MM/YYYY
  const parts = dateString.split('/');

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) return null;

    return date;
  }

  // Tenta parser ISO
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// =====================================================
// FORMATAÇÃO DE CPF e CNPJ
// =====================================================

export function maskCPF(value: string): string {
  if (!value) return '';

  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
}

export function maskCNPJ(value: string): string {
  if (!value) return '';

  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
}

// =====================================================
// FORMATAÇÃO DE TELEFONE
// =====================================================

export function maskPhone(value: string): string {
  if (!value) return '';

  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

// =====================================================
// MÊS/ANO
// =====================================================

export const MONTHS = [
  { value: 1, label: 'Jan', fullLabel: 'Janeiro' },
  { value: 2, label: 'Fev', fullLabel: 'Fevereiro' },
  { value: 3, label: 'Mar', fullLabel: 'Março' },
  { value: 4, label: 'Abr', fullLabel: 'Abril' },
  { value: 5, label: 'Mai', fullLabel: 'Maio' },
  { value: 6, label: 'Jun', fullLabel: 'Junho' },
  { value: 7, label: 'Jul', fullLabel: 'Julho' },
  { value: 8, label: 'Ago', fullLabel: 'Agosto' },
  { value: 9, label: 'Set', fullLabel: 'Setembro' },
  { value: 10, label: 'Out', fullLabel: 'Outubro' },
  { value: 11, label: 'Nov', fullLabel: 'Novembro' },
  { value: 12, label: 'Dez', fullLabel: 'Dezembro' },
];

export function getMonthName(month: number, full: boolean = false): string {
  const monthData = MONTHS.find((m) => m.value === month);
  return monthData ? (full ? monthData.fullLabel : monthData.label) : '';
}

export function getYearsList(startYear?: number, endYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const start = startYear || currentYear - 5;
  const end = endYear || currentYear + 2;

  const years: number[] = [];
  for (let year = start; year <= end; year++) {
    years.push(year);
  }

  return years;
}

// =====================================================
// CÁLCULO DE ENCARGOS
// =====================================================

export interface EncargoCalc {
  name: string;
  value: number;
  is_percentage: boolean;
}

export function calcularCustoMensal(
  salarioBase: number,
  encargos: EncargoCalc[]
): number {
  let custoTotal = salarioBase;

  encargos.forEach((encargo) => {
    if (encargo.is_percentage) {
      custoTotal += salarioBase * (encargo.value / 100);
    } else {
      custoTotal += encargo.value;
    }
  });

  return custoTotal;
}

// =====================================================
// VALIDAÇÕES
// =====================================================

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleaned.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
