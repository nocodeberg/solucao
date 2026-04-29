'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import { FormModal } from '@/components/ui/Modal';
import { Plus, Clock, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { useAuditLog } from '@/hooks/useAuditLog';
import { PecaHora, ProductionLine } from '@/types/database.types';

interface FormData {
  production_line_id: string;
  area_peca_dm2: number;
  peso_peca_kg: number;
  kg_por_carga: number;
  peso_especifico: number;
  equivalente_eletroquimico: number;
  rendimento_corrente: number;
  espessura_mm: number;
  amperagem: number;
  numero_tambores: number;
  densidade_corrente: number;
}

const defaultForm: FormData = {
  production_line_id: '',
  area_peca_dm2: 2.3,
  peso_peca_kg: 0.7,
  kg_por_carga: 30,
  peso_especifico: 7.1,
  equivalente_eletroquimico: 1.2195,
  rendimento_corrente: 90,
  espessura_mm: 4,
  amperagem: 0,
  numero_tambores: 5,
  densidade_corrente: 0.5,
};

// Fórmulas eletroquímicas conforme a planilha
function calcularResultados(d: FormData) {
  const pecasPorCarga = d.peso_peca_kg > 0 ? d.kg_por_carga / d.peso_peca_kg : 0;
  const areaCargaDm2 = pecasPorCarga * d.area_peca_dm2;
  // Amperagem calculada = Área da carga * Densidade de corrente
  const amperagemCalc = d.amperagem > 0 ? d.amperagem : areaCargaDm2 * d.densidade_corrente;
  // Tempo de banho (minutos)
  const rendFrac = d.rendimento_corrente / 100;
  const tempoBanho = d.densidade_corrente > 0 && d.equivalente_eletroquimico > 0 && rendFrac > 0
    ? (d.espessura_mm * d.peso_especifico * 1000) / (d.densidade_corrente * d.equivalente_eletroquimico * rendFrac * 60)
    : 0;
  const pecasPorHora = tempoBanho > 0 ? (pecasPorCarga * d.numero_tambores * 60) / tempoBanho : 0;
  const kgPorHora = pecasPorHora * d.peso_peca_kg;

  return { pecasPorCarga, areaCargaDm2, amperagemCalc, tempoBanho, pecasPorHora, kgPorHora };
}

export default function PecasHoraPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const audit = useAuditLog();
  const [registros, setRegistros] = useState<PecaHora[]>([]);
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) { setLoading(false); return; }
    try {
      setLoading(true);
      const [ph, lines] = await Promise.all([
        apiComplete.pecasHora.list(),
        apiComplete.productionLines.list(),
      ]);
      setRegistros(ph);
      setLinhas(lines);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Usuário não autenticado')) return;
      alert('Erro ao carregar peças por hora');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [authLoading, user, loadData]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (r: PecaHora) => {
    setEditingId(r.id);
    setFormData({
      production_line_id: r.production_line_id,
      area_peca_dm2: parseFloat(String(r.area_peca_dm2 ?? 0)),
      peso_peca_kg: parseFloat(String(r.peso_peca_kg ?? 0)),
      kg_por_carga: parseFloat(String(r.kg_por_carga ?? 0)),
      peso_especifico: parseFloat(String(r.peso_especifico ?? 0)),
      equivalente_eletroquimico: parseFloat(String(r.equivalente_eletroquimico ?? 0)),
      rendimento_corrente: parseFloat(String(r.rendimento_corrente ?? 0)),
      espessura_mm: parseFloat(String(r.espessura_mm ?? 0)),
      amperagem: parseFloat(String(r.amperagem ?? 0)),
      numero_tambores: r.numero_tambores,
      densidade_corrente: parseFloat(String(r.densidade_corrente ?? 0)),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.production_line_id) errors.production_line_id = 'Linha é obrigatória';
    if (formData.area_peca_dm2 <= 0) errors.area_peca_dm2 = 'Deve ser maior que zero';
    if (formData.peso_peca_kg <= 0) errors.peso_peca_kg = 'Deve ser maior que zero';
    if (formData.kg_por_carga <= 0) errors.kg_por_carga = 'Deve ser maior que zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitLoading(true);
      if (editingId) {
        await apiComplete.pecasHora.update(editingId, formData);
        const linhaName = linhas.find(l => l.id === formData.production_line_id)?.name || '';
        await audit.log('UPDATE', 'Peças/Hora', `Editou cálculo peças/hora - ${linhaName}`, editingId);
      } else {
        const result = await apiComplete.pecasHora.create(formData);
        const linhaName = linhas.find(l => l.id === formData.production_line_id)?.name || '';
        await audit.log('CREATE', 'Peças/Hora', `Criou cálculo peças/hora - ${linhaName}`, result?.id);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cálculo?')) return;
    try {
      await apiComplete.pecasHora.delete(id);
      await audit.log('DELETE', 'Peças/Hora', 'Excluiu cálculo peças/hora', id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  // Preview dos cálculos no formulário
  const preview = calcularResultados(formData);

  const fmt = (v: number, dec: number = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  return (
    <MainLayout title="Peças por Hora">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Cálculos eletroquímicos de produtividade por linha</p>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>Novo Cálculo</Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : registros.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum cálculo de peças por hora cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registros.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{r.production_line?.name || 'Linha'}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700 text-sm">Editar</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm">Excluir</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Área da Peça</p>
                  <p className="font-semibold">{fmt(parseFloat(String(r.area_peca_dm2 ?? 0)), 4)} dm²</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Peso da Peça</p>
                  <p className="font-semibold">{fmt(parseFloat(String(r.peso_peca_kg ?? 0)), 4)} kg</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Peças/Carga</p>
                  <p className="font-semibold">{fmt(parseFloat(String(r.pecas_por_carga ?? 0)))}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Área Carga</p>
                  <p className="font-semibold">{fmt(parseFloat(String(r.area_carga_dm2 ?? 0)))} dm²</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Nº Tambores</p>
                  <p className="font-semibold">{r.numero_tambores}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Tempo de Banho</p>
                  <p className="font-semibold">{fmt(parseFloat(String(r.tempo_banho_min ?? 0)))} min</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-600 text-xs font-medium">Peças por Hora</p>
                  <p className="text-xl font-bold text-blue-900">{fmt(parseFloat(String(r.pecas_por_hora ?? 0)))}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-green-600 text-xs font-medium">Kg por Hora</p>
                  <p className="text-xl font-bold text-green-900">{fmt(parseFloat(String(r.kg_por_hora ?? 0)))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}
        title={editingId ? 'Editar Cálculo' : 'Novo Cálculo de Peças/Hora'} submitText={editingId ? 'Salvar' : 'Criar'} isLoading={submitLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção <span className="text-red-500">*</span></label>
            <select value={formData.production_line_id} onChange={(e) => setFormData({ ...formData, production_line_id: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.production_line_id ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Selecione...</option>
              {linhas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {formErrors.production_line_id && <p className="mt-1 text-sm text-red-500">{formErrors.production_line_id}</p>}
          </div>

          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Dados da Peça</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Área (dm²)</label>
              <input type="number" step="0.0001" value={formData.area_peca_dm2}
                onChange={(e) => setFormData({ ...formData, area_peca_dm2: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peso (Kg)</label>
              <input type="number" step="0.0001" value={formData.peso_peca_kg}
                onChange={(e) => setFormData({ ...formData, peso_peca_kg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kg/Carga</label>
              <input type="number" step="0.01" value={formData.kg_por_carga}
                onChange={(e) => setFormData({ ...formData, kg_por_carga: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Parâmetros Eletroquímicos</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peso Específico</label>
              <input type="number" step="0.01" value={formData.peso_especifico}
                onChange={(e) => setFormData({ ...formData, peso_especifico: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Equiv. Eletroquímico</label>
              <input type="number" step="0.0001" value={formData.equivalente_eletroquimico}
                onChange={(e) => setFormData({ ...formData, equivalente_eletroquimico: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rendimento Corrente (%)</label>
              <input type="number" step="1" value={formData.rendimento_corrente}
                onChange={(e) => setFormData({ ...formData, rendimento_corrente: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Espessura (mm)</label>
              <input type="number" step="0.01" value={formData.espessura_mm}
                onChange={(e) => setFormData({ ...formData, espessura_mm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Densidade Corrente (A/dm²)</label>
              <input type="number" step="0.01" value={formData.densidade_corrente}
                onChange={(e) => setFormData({ ...formData, densidade_corrente: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nº Tambores</label>
              <input type="number" step="1" value={formData.numero_tambores}
                onChange={(e) => setFormData({ ...formData, numero_tambores: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Preview calculado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-2">
              <Calculator className="w-4 h-4" /> Resultados Calculados
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Peças/Carga:</span> <strong>{fmt(preview.pecasPorCarga)}</strong></div>
              <div><span className="text-gray-500">Área Carga:</span> <strong>{fmt(preview.areaCargaDm2)} dm²</strong></div>
              <div><span className="text-gray-500">Tempo Banho:</span> <strong>{fmt(preview.tempoBanho)} min</strong></div>
              <div><span className="text-gray-500">Amperagem:</span> <strong>{fmt(preview.amperagemCalc)} A</strong></div>
              <div className="bg-blue-100 rounded p-2"><span className="text-blue-700">Peças/Hora:</span> <strong className="text-lg">{fmt(preview.pecasPorHora)}</strong></div>
              <div className="bg-green-100 rounded p-2"><span className="text-green-700">Kg/Hora:</span> <strong className="text-lg">{fmt(preview.kgPorHora)}</strong></div>
            </div>
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
