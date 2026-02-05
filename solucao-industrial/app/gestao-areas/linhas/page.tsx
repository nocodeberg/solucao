'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import Toggle from '@/components/ui/Toggle';
import { FormModal } from '@/components/ui/Modal';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { ProductionLine, Product } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

interface LinhaFormData {
  name: string;
  description: string;
  active: boolean;
}

interface ProductFormData {
  name: string;
  price: number;
  published: boolean;
}

export default function LinhasPage() {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Linha modal
  const [isLinhaModalOpen, setIsLinhaModalOpen] = useState(false);
  const [editingLinha, setEditingLinha] = useState<ProductionLine | null>(null);
  const [linhaForm, setLinhaForm] = useState<LinhaFormData>({ name: '', description: '', active: true });
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [linhasData, productsData] = await Promise.all([
        api.productionLines.list(),
        api.products.list(),
      ]);
      setLinhas(linhasData);
      setAllProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByLine = (lineId: string) =>
    allProducts.filter((p) => p.production_line_id === lineId);

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
    setLinhaForm({ name: '', description: '', active: true });
    setLinhaFormErrors({});
    setIsLinhaModalOpen(true);
  };

  const handleEditLinha = (linha: ProductionLine) => {
    setEditingLinha(linha);
    setLinhaForm({ name: linha.name, description: linha.description || '', active: linha.active });
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
                  <span className="text-sm font-semibold text-gray-800">{linha.name}</span>

                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Realizar lançamento de Linha
                    </button>

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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600">
                          <th className="text-left px-6 py-3 font-medium">Produto</th>
                          <th className="text-left px-6 py-3 font-medium">Valor</th>
                          <th className="text-left px-6 py-3 font-medium">Publicar</th>
                          <th className="text-left px-6 py-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineProducts.map((product) => (
                          <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-800">{product.name}</td>
                            <td className="px-6 py-3 text-gray-800">{formatCurrency(product.price)}</td>
                            <td className="px-6 py-3">
                              <Toggle
                                checked={product.published}
                                onChange={() => handleTogglePublished(product)}
                              />
                            </td>
                            <td className="px-6 py-3">
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
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-400 text-sm">
                              Nenhum produto cadastrado nesta linha
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
    </MainLayout>
  );
}
