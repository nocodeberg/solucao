export type UserRole = 'ADMIN' | 'GESTOR' | 'RH' | 'OPERADOR' | 'LEITOR';
export type LancamentoTipo = 'MOD' | 'MOI';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id' | 'created_at'>>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      production_lines: {
        Row: ProductionLine;
        Insert: Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductionLine, 'id' | 'created_at'>>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at'>>;
        Relationships: [];
      };
      pieces: {
        Row: Piece;
        Insert: Omit<Piece, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Piece, 'id' | 'created_at'>>;
        Relationships: [];
      };
      cargos: {
        Row: Cargo;
        Insert: Omit<Cargo, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Cargo, 'id' | 'created_at'>>;
        Relationships: [];
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Employee, 'id' | 'created_at'>>;
        Relationships: [];
      };
      encargos: {
        Row: Encargo;
        Insert: Omit<Encargo, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Encargo, 'id' | 'created_at'>>;
        Relationships: [];
      };
      lancamento_mo: {
        Row: LancamentoMO;
        Insert: Omit<LancamentoMO, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LancamentoMO, 'id' | 'created_at'>>;
        Relationships: [];
      };
      manutencao: {
        Row: Manutencao;
        Insert: Omit<Manutencao, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Manutencao, 'id' | 'created_at'>>;
        Relationships: [];
      };
      consumo_agua: {
        Row: ConsumoAgua;
        Insert: Omit<ConsumoAgua, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ConsumoAgua, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductionLine {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  production_line_id: string;
  name: string;
  price: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Piece {
  id: number;
  company_id: string;
  group_id?: string;
  name: string;
  area_dm2: number;
  weight_kg: number;
  production_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Cargo {
  id: string;
  company_id: string;
  nome: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  cargo_id?: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  salario_base: number;
  data_admissao?: string;
  foto_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Encargo {
  id: string;
  company_id: string;
  nome: string;
  percentual: number;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface LancamentoMO {
  id: string;
  company_id: string;
  employee_id: string;
  production_line_id: string;
  tipo: LancamentoTipo;
  mes: number;
  ano: number;
  data_lancamento: string;
  horas_trabalhadas?: number;
  salario_base: number;
  custo_mensal: number;
  observacao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Manutencao {
  id: string;
  company_id: string;
  production_line_id?: string;
  descricao: string;
  valor: number;
  data: string;
  observacao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsumoAgua {
  id: string;
  company_id: string;
  descricao: string;
  valor: number;
  data: string;
  observacao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface EmployeeWithCargo extends Employee {
  cargo?: Cargo;
  ultimo_custo?: number;
}

export interface LancamentoMOWithRelations extends LancamentoMO {
  employee?: Employee;
  production_line?: ProductionLine;
}

export interface ProductWithLine extends Product {
  production_line?: ProductionLine;
}

export interface PieceWithGroup extends Piece {
  group?: Group;
}

export interface ManutencaoWithLine extends Manutencao {
  production_line?: ProductionLine;
}
