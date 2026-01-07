'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import api from '@/lib/api';

interface BotConfig {
  id: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
  contextMessages: number;
  classificationCategories: string[];
  orderInstructions?: string;
  locationInstructions?: string;
  locationKeywords?: string;
  autoCreateOrderOnPaymentRequest?: boolean;
  autoSendQRImages?: boolean;
  notifyOrderStatusChanges?: boolean;
  findNearestBranchOnLocationShare?: boolean;
  showLocationInstructions?: boolean;
  prepareOrderInsteadOfCreate?: boolean;
  extractOrderFromContext?: boolean;
}

export function PromptEditor() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bot-config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || saving) return;
    setSaving(true);

    try {
      await api.put('/bot-config', {
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        model: config.model,
        contextMessages: config.contextMessages,
        classificationCategories: config.classificationCategories,
        orderInstructions: config.orderInstructions,
        locationInstructions: config.locationInstructions,
        locationKeywords: config.locationKeywords,
        autoCreateOrderOnPaymentRequest: config.autoCreateOrderOnPaymentRequest,
        autoSendQRImages: config.autoSendQRImages,
        notifyOrderStatusChanges: config.notifyOrderStatusChanges,
        findNearestBranchOnLocationShare: config.findNearestBranchOnLocationShare,
        showLocationInstructions: config.showLocationInstructions,
        prepareOrderInsteadOfCreate: config.prepareOrderInsteadOfCreate,
        extractOrderFromContext: config.extractOrderFromContext,
      });
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!config) return;
    setConfig({
      ...config,
      classificationCategories: [...config.classificationCategories, ''],
    });
  };

  const handleRemoveCategory = (index: number) => {
    if (!config || config.classificationCategories.length <= 1) return;
    setConfig({
      ...config,
      classificationCategories: config.classificationCategories.filter((_, i) => i !== index),
    });
  };

  const handleCategoryChange = (index: number, value: string) => {
    if (!config) return;
    const newCategories = [...config.classificationCategories];
    newCategories[index] = value;
    setConfig({
      ...config,
      classificationCategories: newCategories,
    });
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  if (!config) {
    return <div className="p-4">No se pudo cargar la configuración</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Prompt del Sistema
        </label>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          rows={10}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="Escribe el prompt del sistema para el bot..."
        />
        <p className="text-xs text-text-secondary mt-1">
          Este prompt define el comportamiento y personalidad del bot.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Temperatura ({config.temperature})
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) =>
              setConfig({ ...config, temperature: parseFloat(e.target.value) })
            }
            className="w-full"
          />
          <p className="text-xs text-text-secondary mt-1">
            Controla la creatividad (0 = determinista, 2 = muy creativo)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Máximo de Tokens
          </label>
          <input
            type="number"
            min="1"
            max="4000"
            value={config.maxTokens}
            onChange={(e) =>
              setConfig({ ...config, maxTokens: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-secondary mt-1">
            Longitud máxima de la respuesta
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Modelo de DeepSeek
          </label>
          <select
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="deepseek-chat">deepseek-chat (Recomendado)</option>
            <option value="deepseek-coder">deepseek-coder</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
          </select>
          <p className="text-xs text-text-secondary mt-1">
            Modelo de IA DeepSeek a utilizar
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Mensajes de Contexto
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.contextMessages}
            onChange={(e) =>
              setConfig({ ...config, contextMessages: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-secondary mt-1">
            Número de mensajes anteriores a considerar (1-20)
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Categorías de Clasificación
        </label>
        <div className="space-y-2">
          {config.classificationCategories.map((category, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={category}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre de categoría"
              />
              {config.classificationCategories.length > 1 && (
                <button
                  onClick={() => handleRemoveCategory(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddCategory}
            className="px-3 py-2 bg-secondary text-text rounded-md hover:bg-secondary/80 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Agregar Categoría</span>
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Categorías usadas para clasificar los mensajes de los usuarios
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Instrucciones para Creación de Pedidos
        </label>
        <textarea
          value={config.orderInstructions || ''}
          onChange={(e) => setConfig({ ...config, orderInstructions: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="Instrucciones que el bot seguirá al crear pedidos..."
        />
        <p className="text-xs text-text-secondary mt-1">
          Instrucciones específicas para cuando el usuario quiere hacer un pedido
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Instrucciones para Ubicación/Sucursales
        </label>
        <textarea
          value={config.locationInstructions || ''}
          onChange={(e) => setConfig({ ...config, locationInstructions: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="Instrucciones para cuando el usuario pregunta por ubicación..."
        />
        <p className="text-xs text-text-secondary mt-1">
          Instrucciones que el bot dará cuando el usuario pregunte por ubicación pero no haya compartido su ubicación
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Palabras Clave para Detectar Consultas de Ubicación
        </label>
        <input
          type="text"
          value={config.locationKeywords || ''}
          onChange={(e) => setConfig({ ...config, locationKeywords: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="ubicación|sucursal|tienda|local|dónde|más cercan..."
        />
        <p className="text-xs text-text-secondary mt-1">
          Patrón regex (separado por |) para detectar cuando el usuario pregunta por ubicación
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Reglas Automáticas del Bot</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Crear Pedido al Preguntar por Métodos de Pago
              </label>
              <p className="text-xs text-text-secondary">
                Crea automáticamente el pedido cuando el usuario pregunta por métodos de pago
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCreateOrderOnPaymentRequest ?? true}
                onChange={(e) => setConfig({ ...config, autoCreateOrderOnPaymentRequest: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Enviar Imágenes QR Automáticamente
              </label>
              <p className="text-xs text-text-secondary">
                Envía automáticamente las imágenes QR cuando se crea un pedido
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSendQRImages ?? true}
                onChange={(e) => setConfig({ ...config, autoSendQRImages: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Notificar Cambios de Estado de Pedidos
              </label>
              <p className="text-xs text-text-secondary">
                Envía notificaciones por WhatsApp cuando cambia el estado de un pedido
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifyOrderStatusChanges ?? true}
                onChange={(e) => setConfig({ ...config, notifyOrderStatusChanges: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Buscar Sucursal Más Cercana al Compartir Ubicación
              </label>
              <p className="text-xs text-text-secondary">
                Busca automáticamente la sucursal más cercana cuando el usuario comparte su ubicación
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.findNearestBranchOnLocationShare ?? true}
                onChange={(e) => setConfig({ ...config, findNearestBranchOnLocationShare: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Mostrar Instrucciones de Ubicación
              </label>
              <p className="text-xs text-text-secondary">
                Muestra instrucciones cuando el usuario pregunta por ubicación sin compartirla
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLocationInstructions ?? true}
                onChange={(e) => setConfig({ ...config, showLocationInstructions: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Preparar Pedido en Lugar de Crearlo Inmediatamente
              </label>
              <p className="text-xs text-text-secondary">
                Prepara el pedido y espera a que el usuario pregunte por métodos de pago antes de crearlo
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.prepareOrderInsteadOfCreate ?? true}
                onChange={(e) => setConfig({ ...config, prepareOrderInsteadOfCreate: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Extraer Información de Pedido del Contexto
              </label>
              <p className="text-xs text-text-secondary">
                Extrae información del pedido del contexto de la conversación cuando se pregunta por métodos de pago
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.extractOrderFromContext ?? true}
                onChange={(e) => setConfig({ ...config, extractOrderFromContext: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
      >
        <Save size={18} />
        <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
      </button>
    </div>
  );
}

