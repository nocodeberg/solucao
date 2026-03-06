'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import Toggle from '@/components/ui/Toggle';
import { FormModal } from '@/components/ui/Modal';
import Modal from '@/components/ui/Modal';
import { Pencil, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { api } from '@/lib/api/client';
import { ProductionLine, Product, LineType, ChemicalProduct, ChemicalProductLaunch } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface LinhaFormData {
  name: string;
  description: string;
  line_type: LineType;
  active: boolean;
}

interface ProductFormData {
  name: string;
  price: number;
  published: boolean;
}

const MONTHS = [
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

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function LinhasPage() {
  const { canCreate, canEdit, canDelete, profile } = useAuth();
  const supabase = useSupabase();
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allChemicalProducts, setAllChemicalProducts] = useState<ChemicalProduct[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Estados para o modal de lançamento
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [selectedLineForLaunch, setSelectedLineForLaunch] = useState<ProductionLine | null>(null);
  const [chemicalProducts, setChemicalProducts] = useState<ChemicalProduct[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [launchData, setLaunchData] = useState<Record<string, number>>({});
  const [consumptionData, setConsumptionData] = useState<Record<string, number>>({});
  const [launchLoading, setLaunchLoading] = useState(false);

  // Linha modal
  const [isLinhaModalOpen, setIsLinhaModalOpen] = useState(false);
  const [editingLinha, setEditingLinha] = useState<ProductionLine | null>(null);
  const [linhaForm, setLinhaForm] = useState<LinhaFormData>({ name: '', description: '', line_type: 'GALVANOPLASTIA', active: true });
  const [linhaFormErrors, setLinhaFormErrors] = useState<Partial<Record<keyof LinhaFormData, string>>>({});
  const [linhaSubmitLoading, setLinhaSubmitLoading] = useState(false);

  // Produto modal
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [produtoForm, setProdutoForm] = useState<ProductFormData>({ name: '', price: 0, published: true });
  const [produtoFormErrors, setProdutoFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [produtoSubmitLoading, setProdutoSubmitLoading] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  // Carregar lançamentos quando mês/ano mudar
  const loadExistingLaunches = useCallback(async () => {
    if (!profile?.company_id || !selectedLineForLaunch) return;

    const { data, error } = await supabase
      .from('chemical_product_launches')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('production_line_id', selectedLineForLaunch.id)
      .eq('mes', selectedMonth)
      .eq('ano', selectedYear);

    if (error) {
      logger.error('Erro ao carregar lançamentos:', error);
      return;
    }

    const launches: Record<string, number> = {};
    const consumptions: Record<string, number> = {};

    data?.forEach((launch: ChemicalProductLaunch) => {
      launches[launch.chemical_product_id] = launch.quantidade || 0;
      consumptions[launch.chemical_product_id] = launch.consumo || 0;
    });

    setLaunchData(launches);
    setConsumptionData(consumptions);
  }, [profile?.company_id, selectedLineForLaunch, selectedMonth, selectedYear, supabase]);

  useEffect(() => {
    if (isLancamentoModalOpen && selectedLineForLaunch) {
      loadExistingLaunches();
    }
  }, [isLancamentoModalOpen, selectedLineForLaunch, loadExistingLaunches]);

  const loadData = async (retryCount = 0) => {
    try {
      setLoading(true);
      const [linhasData, productsData] = await Promise.all([
        api.productionLines.list(),
        api.products.list(),
      ]);
      setLinhas(linhasData);
      setAllProducts(productsData);

      // Carregar produtos químicos
      if (profile?.company_id) {
        logger.log('Carregando produtos químicos para company_id:', profile.company_id);
        const { data: chemicalData, error: chemicalError } = await supabase
          .from('chemical_products')
          .select('*')
          .eq('company_id', profile.company_id)
          .eq('active', true)
          .order('name');

        if (chemicalError) {
          logger.error('Erro ao carregar produtos químicos:', chemicalError);
        } else {
          logger.log('Produtos químicos carregados:', chemicalData?.length || 0);
        }

        setAllChemicalProducts(chemicalData || []);
      } else {
        logger.warn('Nenhum company_id encontrado no profile');
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);

      // Retry automático em caso de erro de rede
      if (retryCount < 2) {
        logger.log(`Tentando reconectar (tentativa ${retryCount + 1}/2)...`);
        setTimeout(() => loadData(retryCount + 1), 2000);
        return;
      }

      const message = error instanceof Error ? error.message : 'Erro desconhecido';

      // Mensagem mais amigável para o usuário
      if (message.includes('Failed to fetch') || message.includes('Network') || message.includes('503')) {
        alert('❌ Erro de conexão\n\nNão foi possível conectar ao servidor. Verifique:\n• Sua conexão com a internet\n• Se o servidor está rodando\n\nTentando reconectar automaticamente...');
      } else {
        alert('Erro ao carregar dados: ' + message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getProductsByLine = (lineId: string) =>
    allProducts.filter((p) => p.production_line_id === lineId);

  const getChemicalProductsByLine = (lineId: string) =>
    allChemicalProducts.filter((p) => p.production_line_id === lineId);

  const toggleExpand = (lineId: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  // --- Linha CRUD ---
  const handleCreateLinha = () => {
    setEditingLinha(null);
    setLinhaForm({ name: '', description: '', line_type: 'GALVANOPLASTIA', active: true });
    setLinhaFormErrors({});
    setIsLinhaModalOpen(true);
  };

  const handleEditLinha = (linha: ProductionLine) => {
    setEditingLinha(linha);
    setLinhaForm({ name: linha.name, description: linha.description || '', line_type: linha.line_type, active: linha.active });
    setLinhaFormErrors({});
    setIsLinhaModalOpen(true);
  };

  const handleDeleteLinha = async (linha: ProductionLine) => {
    if (!confirm(`Tem certeza que deseja excluir a linha "${linha.name}"?`)) return;
    try {
      await api.productionLines.delete(linha.id);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir linha';
      alert(message);
    }
  };

  const validateLinhaForm = (): boolean => {
    const errors: Partial<Record<keyof LinhaFormData, string>> = {};
    if (!linhaForm.name.trim()) errors.name = 'Nome é obrigatório';
    setLinhaFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLinhaSubmit = async () => {
    if (!validateLinhaForm()) return;
    try {
      setLinhaSubmitLoading(true);
      if (editingLinha) {
        await api.productionLines.update(editingLinha.id, linhaForm);
      } else {
        await api.productionLines.create(linhaForm);
      }
      setIsLinhaModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar linha';
      alert(message);
    } finally {
      setLinhaSubmitLoading(false);
    }
  };

  const handleToggleActive = async (linha: ProductionLine) => {
    try {
      await api.productionLines.update(linha.id, { active: !linha.active });
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar linha';
      alert(message);
    }
  };

  // --- Produto CRUD ---
  const handleCreateProduct = (lineId: string) => {
    setSelectedLineId(lineId);
    setEditingProduct(null);
    setProdutoForm({ name: '', price: 0, published: true });
    setProdutoFormErrors({});
    setIsProdutoModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedLineId(product.production_line_id);
    setEditingProduct(product);
    setProdutoForm({ name: product.name, price: product.price, published: product.published });
    setProdutoFormErrors({});
    setIsProdutoModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) return;
    try {
      await api.products.delete(product.id);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir produto';
      alert(message);
    }
  };

  const validateProdutoForm = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!produtoForm.name.trim()) errors.name = 'Nome é obrigatório';
    if (produtoForm.price < 0) errors.price = 'Valor não pode ser negativo';
    setProdutoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProdutoSubmit = async () => {
    if (!validateProdutoForm()) return;
    try {
      setProdutoSubmitLoading(true);
      if (editingProduct) {
        await api.products.update(editingProduct.id, produtoForm);
      } else {
        await api.products.create({ ...produtoForm, production_line_id: selectedLineId });
      }
      setIsProdutoModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar produto';
      alert(message);
    } finally {
      setProdutoSubmitLoading(false);
    }
  };

  const handleTogglePublished = async (product: Product) => {
    try {
      await api.products.update(product.id, { published: !product.published });
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar produto';
      alert(message);
    }
  };


  // --- Lançamento de Produtos Químicos ---
  const handleOpenLancamentoModal = async (linha: ProductionLine) => {
    logger.log('🚀 Abrindo modal para linha:', linha.name, 'ID:', linha.id);

    setSelectedLineForLaunch(linha);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setLaunchData({});
    setConsumptionData({});
    setChemicalProducts([]);

    // Carregar produtos químicos desta linha
    if (profile?.company_id) {
      logger.log('=== 🔍 FILTRO DE PRODUTOS QUÍMICOS ===');
      logger.log('Company ID:', profile.company_id);
      logger.log('Linha ID:', linha.id);
      logger.log('Linha Nome:', linha.name);

      // PRIMEIRO: Verificar todos os produtos da empresa (para debug)
      const { data: todosProdutos, error: errorTodos } = await supabase
        .from('chemical_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name');

      if (errorTodos) {
        logger.error('❌ Erro ao carregar TODOS os produtos:', errorTodos);
      } else {
        logger.log('📊 TODOS os produtos da empresa:', todosProdutos?.length || 0);
        todosProdutos?.forEach((p, i) => {
          logger.log(`  ${i + 1}. ${p.name} (Linha: ${p.production_line_id || 'NULL'})`);
        });
      }

      // SEGUNDO: Filtrar apenas produtos da linha específica
      const { data, error } = await supabase
        .from('chemical_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('production_line_id', linha.id)
        .eq('active', true)
        .order('name');

      if (error) {
        logger.error('❌ Erro ao carregar produtos da linha:', error);
        alert('Erro ao carregar produtos químicos: ' + error.message);
      } else {
        logger.log('✅ Produtos da linha encontrados:', data?.length || 0);

        if (data && data.length > 0) {
          logger.log('📦 Produtos da linha selecionada:');
          data.forEach((p, i) => {
            logger.log(`  ${i + 1}. ${p.name} (ID: ${p.id}, Linha: ${p.production_line_id})`);
          });
        } else {
          logger.warn('⚠️ NENHUM produto encontrado para esta linha!');
          logger.warn('Verificando se há produtos sem linha...');
          
          const produtosSemLinha = todosProdutos?.filter(p => !p.production_line_id);
          if (produtosSemLinha && produtosSemLinha.length > 0) {
            logger.warn(`🚨 ENCONTRADOS ${produtosSemLinha.length} PRODUTOS SEM LINHA!`);
            logger.warn('Esses produtos podem estar aparecendo no modal.');
            produtosSemLinha.forEach((p, i) => {
              logger.warn(`  ${i + 1}. ${p.name} (ID: ${p.id})`);
            });
          }
        }

        setChemicalProducts(data || []);
        logger.log(`🎯 SetChemicalProducts chamado com ${data?.length || 0} produtos`);
        
        // FORÇAR ATUALIZAÇÃO DO ESTADO
        setTimeout(() => {
          logger.log('🔄 Verificando estado após atualização...');
          logger.log('chemicalProducts.length:', chemicalProducts.length);
          logger.log('selectedLineForLaunch:', selectedLineForLaunch?.name);
          
          // FORÇAR RENDERIZAÇÃO
          setChemicalProducts([...(data || [])]);
        }, 100);
      }
    } else {
      logger.error('❌ Profile não encontrado ou sem company_id');
    }

    setIsLancamentoModalOpen(true);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLaunchData((prev) => ({
      ...prev,
      [productId]: numValue,
    }));
  };

  const handleSaveLaunches = async () => {
    if (!profile?.company_id || !profile?.id || !selectedLineForLaunch) return;

    setLaunchLoading(true);
    try {
      const launches = [];

      for (const product of chemicalProducts) {
        const quantidade = launchData[product.id] || 0;
        const custo_total = quantidade * product.unit_price;

        launches.push({
          company_id: profile.company_id,
          chemical_product_id: product.id,
          production_line_id: selectedLineForLaunch.id,
          mes: selectedMonth,
          ano: selectedYear,
          quantidade,
          consumo: 0,
          custo_unitario: product.unit_price,
          custo_total,
          created_by: profile.id,
        });
      }

      const { error } = await supabase
        .from('chemical_product_launches')
        .upsert(launches);

      if (error) {
        logger.error('Erro ao salvar lançamento:', error);
        throw error;
      }

      alert('Lançamentos salvos com sucesso!');
      setIsLancamentoModalOpen(false);
      setLaunchData({});
    } catch (error) {
      logger.error('Erro ao salvar lançamentos:', error);
      alert('Erro ao salvar lançamentos');
    } finally {
      setLaunchLoading(false);
    }
  };


  return (
    <MainLayout title="Cadastro Processo">
      {/* Tabs + Nova Linha */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white"
          >
            Linhas de produção
          </button>
          <Link
            href="/gestao-areas/pecas"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            Peças
          </Link>
        </div>
        {canCreate && (
          <button
            onClick={handleCreateLinha}
            className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            + Nova Linha
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600">Carregando...</p>}

      {/* Production Lines */}
      {!loading && (
        <div className="space-y-3">
          {linhas.map((linha) => {
            const isExpanded = expandedLines.has(linha.id);
            const lineProducts = getProductsByLine(linha.id);

            return (
              <div key={linha.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Line Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{linha.name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      linha.line_type === 'VERNIZ'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                      {linha.line_type === 'VERNIZ' ? 'Verniz' : 'Galvanoplastia'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {canCreate && (
                      <button
                        onClick={() => handleOpenLancamentoModal(linha)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Realizar lançamento de Linha
                      </button>
                    )}

                    <Toggle
                      checked={linha.active}
                      onChange={() => handleToggleActive(linha)}
                    />

                    {canCreate && (
                      <button
                        onClick={() => handleCreateProduct(linha.id)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        + Novo produto
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(linha.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleEditLinha(linha)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteLinha(linha)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Products Table */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* Produtos de Matéria-Prima */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Produtos / Matéria-Prima ({lineProducts.length})</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="text-left px-4 py-2 font-medium">Produto</th>
                            <th className="text-left px-4 py-2 font-medium">Valor</th>
                            <th className="text-left px-4 py-2 font-medium">Publicar</th>
                            <th className="text-left px-4 py-2 font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineProducts.map((product) => (
                            <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-800">{product.name}</td>
                              <td className="px-4 py-2 text-gray-800">{formatCurrency(product.price)}</td>
                              <td className="px-4 py-2">
                                <Toggle
                                  checked={product.published}
                                  onChange={() => handleTogglePublished(product)}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  {canEdit && (
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteProduct(product)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {lineProducts.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-center text-gray-400 text-sm">
                                Nenhum produto de matéria-prima cadastrado
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {linhas.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nenhuma linha de produção cadastrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Linha */}
      <FormModal
        isOpen={isLinhaModalOpen}
        onClose={() => setIsLinhaModalOpen(false)}
        onSubmit={handleLinhaSubmit}
        title={editingLinha ? 'Editar Linha' : 'Nova Linha de Produção'}
        submitText={editingLinha ? 'Salvar' : 'Criar'}
        isLoading={linhaSubmitLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={linhaForm.name}
              onChange={(e) => setLinhaForm({ ...linhaForm, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                linhaFormErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Linha 1 - Montagem"
            />
            {linhaFormErrors.name && <p className="mt-1 text-sm text-red-500">{linhaFormErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={linhaForm.description}
              onChange={(e) => setLinhaForm({ ...linhaForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição da linha (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Linha <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLinhaForm({ ...linhaForm, line_type: 'GALVANOPLASTIA' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  linhaForm.line_type === 'GALVANOPLASTIA'
                    ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                }`}
              >
                Galvanoplastia
              </button>
              <button
                type="button"
                onClick={() => setLinhaForm({ ...linhaForm, line_type: 'VERNIZ' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  linhaForm.line_type === 'VERNIZ'
                    ? 'bg-purple-600 text-white border-2 border-purple-600 shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                Verniz
              </button>
            </div>
          </div>

          <Toggle
            checked={linhaForm.active}
            onChange={(checked) => setLinhaForm({ ...linhaForm, active: checked })}
            label="Linha ativa"
          />
        </div>
      </FormModal>

      {/* Modal: Produto */}
      <FormModal
        isOpen={isProdutoModalOpen}
        onClose={() => setIsProdutoModalOpen(false)}
        onSubmit={handleProdutoSubmit}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        submitText={editingProduct ? 'Salvar' : 'Criar'}
        isLoading={produtoSubmitLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={produtoForm.name}
              onChange={(e) => setProdutoForm({ ...produtoForm, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                produtoFormErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Sulfato de Cobre"
            />
            {produtoFormErrors.name && <p className="mt-1 text-sm text-red-500">{produtoFormErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={produtoForm.price}
              onChange={(e) => setProdutoForm({ ...produtoForm, price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                produtoFormErrors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {produtoFormErrors.price && <p className="mt-1 text-sm text-red-500">{produtoFormErrors.price}</p>}
          </div>

          <Toggle
            checked={produtoForm.published}
            onChange={(checked) => setProdutoForm({ ...produtoForm, published: checked })}
            label="Publicar"
          />
        </div>
      </FormModal>

      {/* Modal: Lançamento de Produtos Químicos */}
      <Modal
        isOpen={isLancamentoModalOpen}
        onClose={() => setIsLancamentoModalOpen(false)}
        title={selectedLineForLaunch ? `Lançamento de Pré-Tratamento - ${selectedLineForLaunch.name}` : 'Lançamento de Pré-Tratamento'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Seletor de Meses */}
          <div className="flex items-center gap-2 flex-wrap">
            {MONTHS.map((month) => (
              <button
                key={month.value}
                onClick={() => setSelectedMonth(month.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMonth === month.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {month.label}/{selectedYear}
              </button>
            ))}
          </div>

          {/* Tabela de Produtos Químicos */}
          {chemicalProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">Nenhum produto químico cadastrado para esta linha</p>
              <p className="text-sm mb-4">
                Linha: <span className="font-semibold">{selectedLineForLaunch?.name}</span>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Solução:</strong> Cadastre produtos químicos específicos para esta linha 
                  na página de "Lançamento de Pré-Tratamento"
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Produtos
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Lançamento
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Consumo
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Custo/kg
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Custo Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chemicalProducts.map((product) => {
                    const quantidade = launchData[product.id] || 0;
                    const consumo = consumptionData[product.id] || 0;
                    const custoTotal = quantidade * product.unit_price;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={launchData[product.id] || 0}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {consumo > 0 ? consumo.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {formatCurrency(product.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(custoTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsLancamentoModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveLaunches}
              disabled={launchLoading || chemicalProducts.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launchLoading ? 'Salvando...' : 'Salvar Lançamentos'}
            </button>
          </div>
        </div>
      </Modal>

    </MainLayout>
  );
}
