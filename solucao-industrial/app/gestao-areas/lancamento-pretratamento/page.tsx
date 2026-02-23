'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChemicalProduct } from '@/types/database.types';

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
  const { profile } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [products, setProducts] = useState<ChemicalProduct[]>([]);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [launchData, setLaunchData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Carregar produtos químicos
  useEffect(() => {
    async function loadProducts() {
      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('chemical_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

      setProducts(data || []);
    }

    loadProducts();
  }, [profile?.company_id, supabase]);

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
          mes: selectedMonth,
          ano: selectedYear,
          quantidade,
          consumo: 0, // Por enquanto 0, pode ser calculado depois
          custo_unitario: product.unit_price,
          custo_total,
          created_by: profile.id,
        });
      }

      // Inserir ou atualizar lançamentos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('chemical_product_launches')
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <MainLayout title="Lançamento de Pré-Tratamento">
      <div className="mb-6">
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenLaunchModal}
        >
          Novo Lançamento
        </Button>
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

      {/* Lista de Produtos Cadastrados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Produtos Químicos Cadastrados
        </h2>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum produto químico cadastrado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo/kg
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
