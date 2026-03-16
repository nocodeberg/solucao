'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FormModal } from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChemicalProduct, ProductionLine } from '@/types/database.types';

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

export default function LancamentoPreTratamentoPage() {
  const { profile, canCreate, canEdit, canDelete } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [products, setProducts] = useState<ChemicalProduct[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [launchData, setLaunchData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Estados para modal de produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    unit_price: 0,
    unit: 'kg',
    production_line_id: '',
  });
  const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({});
  const [productSubmitLoading, setProductSubmitLoading] = useState(false);

  // Carregar produtos químicos e linhas de produção
  useEffect(() => {
    async function loadData() {
      if (!profile?.company_id) return;

      // Carregar linhas de produção
      const { data: linesData, error: linesError } = await supabase
        .from('production_lines')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name');

      if (linesError) {
        console.error('Erro ao carregar linhas:', linesError);
      } else {
        const lines = (linesData || []) as ProductionLine[];
        setProductionLines(lines);
        // Selecionar a primeira linha por padrão
        if (lines.length > 0 && !selectedLineId) {
          setSelectedLineId(lines[0].id);
        }
      }

      // Carregar produtos químicos apenas da linha selecionada
      if (selectedLineId) {
        const { data, error } = await supabase
          .from('chemical_products')
          .select('*')
          .eq('company_id', profile.company_id)
          .eq('production_line_id', selectedLineId)
          .eq('active', true)
          .order('name');

        if (error) {
          console.error('Erro ao carregar produtos:', error);
          return;
        }

        setProducts(data || []);
      } else {
        // Se não há linha selecionada, não mostrar produtos
        setProducts([]);
      }
    }

    loadData();
  }, [profile?.company_id, selectedLineId, supabase]);

  const handleOpenLaunchModal = () => {
    setIsLaunchModalOpen(true);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setLaunchData({});
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLaunchData((prev) => ({
      ...prev,
      [productId]: numValue,
    }));
  };

  const handleSaveLaunches = async () => {
    if (!profile?.company_id || !profile?.id) return;

    setLoading(true);
    try {
      const launches = [];

      for (const product of products) {
        const quantidade = launchData[product.id] || 0;
        const custo_total = quantidade * product.unit_price;

        launches.push({
          company_id: profile.company_id,
          chemical_product_id: product.id,
          production_line_id: product.production_line_id,
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
        // @ts-expect-error - Supabase type inference issue with upsert
        .upsert(launches);

      if (error) {
        console.error('Erro ao salvar lançamento:', error);
        throw error;
      }

      alert('Lançamentos salvos com sucesso!');
      setIsLaunchModalOpen(false);
      setLaunchData({});
    } catch (error) {
      console.error('Erro ao salvar lançamentos:', error);
      alert('Erro ao salvar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  // CRUD de Produtos Químicos
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      unit_price: 0,
      unit: 'kg',
      production_line_id: selectedLineId,
    });
    setProductFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: ChemicalProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      unit_price: product.unit_price,
      unit: product.unit,
      production_line_id: product.production_line_id || '',
    });
    setProductFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (product: ChemicalProduct) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('chemical_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      // Recarregar produtos
      if (!profile?.company_id) return;

      const { data } = await supabase
        .from('chemical_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name');

      setProducts(data || []);
      alert('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    }
  };

  const validateProductForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!productForm.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    if (productForm.unit_price <= 0) {
      errors.unit_price = 'Preço deve ser maior que zero';
    }
    if (!productForm.production_line_id) {
      errors.production_line_id = 'Linha de produção é obrigatória';
    }

    setProductFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProductSubmit = async () => {
    if (!validateProductForm() || !profile?.company_id) return;

    setProductSubmitLoading(true);
    try {
      if (editingProduct) {
        // Atualizar
        const { error } = await supabase
          .from('chemical_products')
          // @ts-expect-error - Supabase type inference issue
          .update({
            name: productForm.name,
            unit_price: productForm.unit_price,
            unit: productForm.unit,
            production_line_id: productForm.production_line_id,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('chemical_products')
          // @ts-expect-error - Supabase type inference issue
          .insert({
            company_id: profile.company_id,
            name: productForm.name,
            unit_price: productForm.unit_price,
            unit: productForm.unit,
            production_line_id: productForm.production_line_id,
            active: true,
          });

        if (error) throw error;
      }

      // Recarregar produtos
      const { data } = await supabase
        .from('chemical_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name');

      setProducts(data || []);
      setIsProductModalOpen(false);
      alert(editingProduct ? 'Produto atualizado!' : 'Produto criado!');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    } finally {
      setProductSubmitLoading(false);
    }
  };

  const getLineName = (lineId: string | null | undefined) => {
    if (!lineId) return 'Sem linha';
    const line = productionLines.find(l => l.id === lineId);
    return line?.name || 'Linha não encontrada';
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <MainLayout title="Lançamento de Pré-Tratamento">
      <div className="mb-6">
        {/* Seletor de Linha */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Linha de Produção
          </label>
          <select
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Selecione uma linha</option>
            {productionLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          {canCreate && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreateProduct}
              disabled={!selectedLineId}
            >
              Novo Produto Químico
            </Button>
          )}
          <Button
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenLaunchModal}
            disabled={!selectedLineId || products.length === 0}
          >
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Modal de Lançamento */}
      <Modal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        title="Lançamento de Pré-Tratamento"
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

          {/* Tabela de Produtos */}
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
                {products.map((product) => {
                  const quantidade = launchData[product.id] || 0;
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
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        -
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

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setIsLaunchModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveLaunches}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Lançamentos'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cadastro/Edição de Produto Químico */}
      <FormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        title={editingProduct ? 'Editar Produto Químico' : 'Novo Produto Químico'}
        submitText={editingProduct ? 'Salvar' : 'Criar'}
        isLoading={productSubmitLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                productFormErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Sulfato de Cobre"
            />
            {productFormErrors.name && (
              <p className="mt-1 text-sm text-red-500">{productFormErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linha de Produção <span className="text-red-500">*</span>
            </label>
            <select
              value={productForm.production_line_id}
              onChange={(e) => setProductForm({ ...productForm, production_line_id: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                productFormErrors.production_line_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione uma linha</option>
              {productionLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
            {productFormErrors.production_line_id && (
              <p className="mt-1 text-sm text-red-500">{productFormErrors.production_line_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço Unitário (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={productForm.unit_price}
              onChange={(e) => setProductForm({ ...productForm, unit_price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                productFormErrors.unit_price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {productFormErrors.unit_price && (
              <p className="mt-1 text-sm text-red-500">{productFormErrors.unit_price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade <span className="text-red-500">*</span>
            </label>
            <select
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="kg">kg (Quilograma)</option>
              <option value="L">L (Litro)</option>
              <option value="un">un (Unidade)</option>
              <option value="m">m (Metro)</option>
              <option value="m²">m² (Metro quadrado)</option>
            </select>
          </div>
        </div>
      </FormModal>

      {/* Lista de Produtos Cadastrados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Produtos Químicos Cadastrados
          {selectedLineId && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              - {productionLines.find(l => l.id === selectedLineId)?.name}
            </span>
          )}
        </h2>
        
        {!selectedLineId ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Selecione uma linha de produção para visualizar os produtos</p>
            <p className="text-sm">Os produtos químicos são específicos para cada linha de produção</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Nenhum produto químico cadastrado para esta linha</p>
            {canCreate && (
              <p className="text-sm">
                Clique em &quot;Novo Produto Químico&quot; para adicionar produtos à linha selecionada
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linha de Produção
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo/kg
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getLineName(product.production_line_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {product.unit}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {canEdit && (
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
