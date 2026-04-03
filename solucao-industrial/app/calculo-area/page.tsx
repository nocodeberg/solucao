'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Ruler } from 'lucide-react';

type Forma = 'retangulo' | 'cilindro' | 'cilindro_oco' | 'circulo' | 'arame' | 'chapa';

const FORMAS: { value: Forma; label: string }[] = [
  { value: 'retangulo', label: 'Retângulo / Quadrado' },
  { value: 'cilindro', label: 'Cilindro' },
  { value: 'cilindro_oco', label: 'Cilindro Oco / Arruela' },
  { value: 'circulo', label: 'Círculo' },
  { value: 'arame', label: 'Arame (Aço)' },
  { value: 'chapa', label: 'Chapa (Aço)' },
];

function calcularArea(forma: Forma, params: Record<string, number>): number {
  const PI = Math.PI;
  switch (forma) {
    case 'retangulo': {
      // Área total = 2*(C*L + C*E + L*E) convertido para dm²
      const c = params.comprimento || 0;
      const l = params.largura || 0;
      const e = params.espessura || 0;
      return (2 * (c * l + c * e + l * e)) / 100; // cm² -> dm²
    }
    case 'cilindro': {
      // Área = 2*PI*r*h + 2*PI*r² (lateral + 2 bases)
      const d = params.diametro || 0;
      const h = params.altura || 0;
      const r = d / 2;
      return (2 * PI * r * h + 2 * PI * r * r) / 100;
    }
    case 'cilindro_oco': {
      // Arruela: Área externa + interna + 2 topos
      const de = params.diametro_externo || 0;
      const di = params.diametro_interno || 0;
      const h = params.altura || 0;
      const re = de / 2;
      const ri = di / 2;
      const areaExterna = 2 * PI * re * h;
      const areaInterna = 2 * PI * ri * h;
      const areaTopos = 2 * PI * (re * re - ri * ri);
      return (areaExterna + areaInterna + areaTopos) / 100;
    }
    case 'circulo': {
      const d = params.diametro || 0;
      const r = d / 2;
      return (PI * r * r) / 100; // uma face
    }
    case 'arame': {
      // Área lateral do cilindro = PI * d * comprimento
      const d = params.diametro || 0;
      const comp = params.comprimento || 0;
      return (PI * d * comp) / 100;
    }
    case 'chapa': {
      // 2 faces + laterais
      const c = params.comprimento || 0;
      const l = params.largura || 0;
      const e = params.espessura || 0;
      return (2 * c * l + 2 * c * e + 2 * l * e) / 100;
    }
    default:
      return 0;
  }
}

function getParamsDef(forma: Forma): { key: string; label: string; unit: string }[] {
  switch (forma) {
    case 'retangulo':
      return [
        { key: 'comprimento', label: 'Comprimento', unit: 'cm' },
        { key: 'largura', label: 'Largura', unit: 'cm' },
        { key: 'espessura', label: 'Espessura', unit: 'cm' },
      ];
    case 'cilindro':
      return [
        { key: 'diametro', label: 'Diâmetro', unit: 'cm' },
        { key: 'altura', label: 'Altura', unit: 'cm' },
      ];
    case 'cilindro_oco':
      return [
        { key: 'diametro_externo', label: 'Diâmetro Externo', unit: 'cm' },
        { key: 'diametro_interno', label: 'Diâmetro Interno', unit: 'cm' },
        { key: 'altura', label: 'Altura', unit: 'cm' },
      ];
    case 'circulo':
      return [
        { key: 'diametro', label: 'Diâmetro', unit: 'cm' },
      ];
    case 'arame':
      return [
        { key: 'diametro', label: 'Diâmetro', unit: 'cm' },
        { key: 'comprimento', label: 'Comprimento', unit: 'cm' },
      ];
    case 'chapa':
      return [
        { key: 'comprimento', label: 'Comprimento', unit: 'cm' },
        { key: 'largura', label: 'Largura', unit: 'cm' },
        { key: 'espessura', label: 'Espessura', unit: 'cm' },
      ];
    default:
      return [];
  }
}

export default function CalculoAreaPage() {
  const [forma, setForma] = useState<Forma>('retangulo');
  const [params, setParams] = useState<Record<string, number>>({});

  const paramsDef = getParamsDef(forma);
  const area = calcularArea(forma, params);

  const handleFormaChange = (f: Forma) => {
    setForma(f);
    setParams({});
  };

  return (
    <MainLayout title="Cálculo de Área">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">Calculadora de área de peças para galvanoplastia (resultado em dm²)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Seletor de forma */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Forma Geométrica</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FORMAS.map(f => (
                <button
                  key={f.value}
                  onClick={() => handleFormaChange(f.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    forma === f.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Dimensões ({FORMAS.find(f => f.value === forma)?.label})</h3>
            <div className="grid grid-cols-2 gap-4">
              {paramsDef.map(p => (
                <div key={p.key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{p.label} ({p.unit})</label>
                  <input
                    type="number"
                    step="0.001"
                    value={params[p.key] || ''}
                    onChange={(e) => setParams({ ...params, [p.key]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Área Calculada</p>
                <p className="text-3xl font-bold text-blue-900">{area.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} dm²</p>
              </div>
            </div>
            <p className="text-xs text-blue-600">
              = {(area * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cm²
              = {(area / 100).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} m²
            </p>
          </div>
        </div>

        {/* Referência de fórmulas */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Fórmulas Utilizadas</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p><strong>Retângulo/Quadrado:</strong> 2×(C×L + C×E + L×E)</p>
            <p><strong>Cilindro:</strong> 2×π×r×h + 2×π×r² (lateral + bases)</p>
            <p><strong>Cilindro Oco/Arruela:</strong> Área externa + interna + 2 topos</p>
            <p><strong>Círculo:</strong> π×r² (uma face)</p>
            <p><strong>Arame:</strong> π×d×comprimento (superfície lateral)</p>
            <p><strong>Chapa:</strong> 2×(C×L) + 2×(C×E) + 2×(L×E)</p>
            <p className="mt-2 text-gray-400">Todas as medidas de entrada em cm. Resultado convertido para dm² (÷100)</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
