'use client';

import { useState, useEffect } from 'react';
import { 
  Save, Plus, X, Info, Bot, Settings, MessageSquare, MapPin, 
  ShoppingCart, Zap, HelpCircle, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  isActive: boolean;
  order: number;
  category?: string;
}

interface InfoTooltipProps {
  content: string;
}

function InfoTooltip({ content }: InfoTooltipProps) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-text-secondary hover:text-primary transition-colors"
        aria-label="Información"
      >
        <Info size={16} />
      </button>
      {show && (
        <div className="absolute z-50 left-0 top-6 w-64 p-3 bg-panel border border-border rounded-lg shadow-lg text-xs text-text-primary">
          {content}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-panel border-l border-t border-border transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

export function BotConfigEditor() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'faq'>('config');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    advanced: false,
    rules: true,
    faq: false,
  });
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    keywords: [],
    isActive: true,
    order: 0,
    category: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
    loadFaqs();
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

  const loadFaqs = async () => {
    try {
      const response = await api.get('/faqs');
      setFaqs(response.data.sort((a: FAQ, b: FAQ) => a.order - b.order));
    } catch (error) {
      console.error('Error loading FAQs:', error);
    }
  };

  const handleSave = async () => {
    if (!config || saving) return;
    setSaving(true);
    setSaveSuccess(false);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCreateFaq = async () => {
    try {
      await api.post('/faqs', newFaq);
      await loadFaqs();
      setNewFaq({
        question: '',
        answer: '',
        keywords: [],
        isActive: true,
        order: 0,
        category: '',
      });
    } catch (error) {
      console.error('Error creating FAQ:', error);
      alert('Error al crear la FAQ');
    }
  };

  const handleUpdateFaq = async (id: string, data: Partial<FAQ>) => {
    try {
      await api.put(`/faqs/${id}`, data);
      await loadFaqs();
      setEditingFaq(null);
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Error al actualizar la FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta FAQ?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      await loadFaqs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Error al eliminar la FAQ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-4 text-center text-text-secondary">
        <AlertCircle className="mx-auto mb-2" size={24} />
        No se pudo cargar la configuración
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Bot size={32} className="text-primary" />
          Configuración del Bot
        </h1>
        <p className="text-text-secondary">Personaliza el comportamiento y las respuestas de tu asistente virtual</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'config'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Settings size={18} className="inline mr-2" />
          Configuración
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'faq'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <HelpCircle size={18} className="inline mr-2" />
          Preguntas Frecuentes (FAQ)
        </button>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Basic Settings Section */}
          <div className="bg-panel border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full px-6 py-4 flex items-center justify-between bg-background hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Configuración Básica</h2>
              </div>
              {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.basic && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Prompt del Sistema
                    <InfoTooltip content="Define la personalidad y comportamiento principal del bot. Este prompt se envía al modelo de IA en cada conversación." />
                  </label>
                  <textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
                    placeholder="Escribe el prompt del sistema para el bot..."
                  />
                  <p className="text-xs text-text-secondary mt-2">
                    Este prompt define el comportamiento y personalidad del bot. Sé específico sobre su rol y limitaciones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      Temperatura: {config.temperature}
                      <InfoTooltip content="Controla la creatividad de las respuestas. Valores bajos (0-0.5) = más determinista y consistente. Valores altos (1-2) = más creativo y variado." />
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
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>Determinista</span>
                      <span>Creativo</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      Máximo de Tokens
                      <InfoTooltip content="Longitud máxima de la respuesta del bot en tokens. 1 token ≈ 0.75 palabras. Valores más altos permiten respuestas más largas pero consumen más recursos." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4000"
                      value={config.maxTokens}
                      onChange={(e) =>
                        setConfig({ ...config, maxTokens: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      Modelo de DeepSeek
                      <InfoTooltip content="Modelo de IA a utilizar. deepseek-chat es el recomendado para conversaciones. deepseek-coder es mejor para código. deepseek-reasoner para razonamiento complejo." />
                    </label>
                    <select
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="deepseek-chat">deepseek-chat (Recomendado)</option>
                      <option value="deepseek-coder">deepseek-coder</option>
                      <option value="deepseek-reasoner">deepseek-reasoner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      Mensajes de Contexto
                      <InfoTooltip content="Número de mensajes anteriores que el bot considerará al generar una respuesta. Más contexto = mejor comprensión pero más costo." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={config.contextMessages}
                      onChange={(e) =>
                        setConfig({ ...config, contextMessages: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Categorías de Clasificación
                    <InfoTooltip content="Categorías que el bot usará para clasificar automáticamente los mensajes de los usuarios. Útiles para organizar conversaciones." />
                  </label>
                  <div className="space-y-2">
                    {config.classificationCategories.map((category, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nombre de categoría"
                        />
                        {config.classificationCategories.length > 1 && (
                          <button
                            onClick={() => handleRemoveCategory(index)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            aria-label="Eliminar categoría"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-secondary text-text rounded-lg hover:bg-secondary/80 flex items-center gap-2 transition-colors"
                    >
                      <Plus size={18} />
                      <span>Agregar Categoría</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Instructions Section */}
          <div className="bg-panel border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('advanced')}
              className="w-full px-6 py-4 flex items-center justify-between bg-background hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Instrucciones Avanzadas</h2>
              </div>
              {expandedSections.advanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.advanced && (
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Instrucciones para Creación de Pedidos
                    <InfoTooltip content="Instrucciones específicas que el bot seguirá cuando el usuario quiera hacer un pedido. Define el flujo paso a paso." />
                  </label>
                  <textarea
                    value={config.orderInstructions || ''}
                    onChange={(e) => setConfig({ ...config, orderInstructions: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
                    placeholder="Instrucciones que el bot seguirá al crear pedidos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Instrucciones para Ubicación/Sucursales
                    <InfoTooltip content="Instrucciones que el bot dará cuando el usuario pregunte por ubicación pero no haya compartido su ubicación en Google Maps." />
                  </label>
                  <textarea
                    value={config.locationInstructions || ''}
                    onChange={(e) => setConfig({ ...config, locationInstructions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
                    placeholder="Instrucciones para cuando el usuario pregunta por ubicación..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Palabras Clave para Detectar Consultas de Ubicación
                    <InfoTooltip content="Patrón regex (separado por |) para detectar cuando el usuario pregunta por ubicación. Ejemplo: ubicación|sucursal|tienda|dónde" />
                  </label>
                  <input
                    type="text"
                    value={config.locationKeywords || ''}
                    onChange={(e) => setConfig({ ...config, locationKeywords: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ubicación|sucursal|tienda|local|dónde|más cercan..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rules Section */}
          <div className="bg-panel border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('rules')}
              className="w-full px-6 py-4 flex items-center justify-between bg-background hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Reglas Automáticas</h2>
              </div>
              {expandedSections.rules ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.rules && (
              <div className="p-6 space-y-4">
                {[
                  {
                    key: 'autoCreateOrderOnPaymentRequest',
                    label: 'Crear Pedido al Preguntar por Métodos de Pago',
                    description: 'Crea automáticamente el pedido cuando el usuario pregunta por métodos de pago',
                    icon: ShoppingCart,
                  },
                  {
                    key: 'autoSendQRImages',
                    label: 'Enviar Imágenes QR Automáticamente',
                    description: 'Envía automáticamente las imágenes QR cuando se crea un pedido',
                    icon: MessageSquare,
                  },
                  {
                    key: 'notifyOrderStatusChanges',
                    label: 'Notificar Cambios de Estado de Pedidos',
                    description: 'Envía notificaciones por WhatsApp cuando cambia el estado de un pedido',
                    icon: Zap,
                  },
                  {
                    key: 'findNearestBranchOnLocationShare',
                    label: 'Buscar Sucursal Más Cercana al Compartir Ubicación',
                    description: 'Busca automáticamente la sucursal más cercana cuando el usuario comparte su ubicación',
                    icon: MapPin,
                  },
                  {
                    key: 'showLocationInstructions',
                    label: 'Mostrar Instrucciones de Ubicación',
                    description: 'Muestra instrucciones cuando el usuario pregunta por ubicación sin compartirla',
                    icon: MapPin,
                  },
                  {
                    key: 'prepareOrderInsteadOfCreate',
                    label: 'Preparar Pedido en Lugar de Crearlo Inmediatamente',
                    description: 'Prepara el pedido y espera a que el usuario pregunte por métodos de pago antes de crearlo',
                    icon: ShoppingCart,
                  },
                  {
                    key: 'extractOrderFromContext',
                    label: 'Extraer Información de Pedido del Contexto',
                    description: 'Extrae información del pedido del contexto de la conversación cuando se pregunta por métodos de pago',
                    icon: MessageSquare,
                  },
                ].map((rule) => {
                  const Icon = rule.icon;
                  const value = config[rule.key as keyof BotConfig] as boolean;
                  return (
                    <div
                      key={rule.key}
                      className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 flex items-start gap-3">
                        <Icon size={20} className="text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1 text-text-primary">
                            {rule.label}
                          </label>
                          <p className="text-xs text-text-secondary">{rule.description}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={value ?? true}
                          onChange={(e) =>
                            setConfig({ ...config, [rule.key]: e.target.checked } as any)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between p-4 bg-panel border border-border rounded-lg">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 size={18} />
                  <span className="text-sm">Configuración guardada exitosamente</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Add New FAQ */}
          <div className="bg-panel border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Nueva Pregunta Frecuente
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pregunta</label>
                <input
                  type="text"
                  value={newFaq.question || ''}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="¿Cuál es tu pregunta?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Respuesta</label>
                <textarea
                  value={newFaq.answer || ''}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  placeholder="Escribe la respuesta..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría (opcional)</label>
                  <input
                    type="text"
                    value={newFaq.category || ''}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: productos, pagos, envíos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orden</label>
                  <input
                    type="number"
                    value={newFaq.order || 0}
                    onChange={(e) => setNewFaq({ ...newFaq, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateFaq}
                disabled={!newFaq.question || !newFaq.answer}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                <span>Crear FAQ</span>
              </button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay FAQs creadas aún</p>
              </div>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-panel border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  {editingFaq?.id === faq.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Pregunta</label>
                        <input
                          type="text"
                          value={editingFaq.question}
                          onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Respuesta</label>
                        <textarea
                          value={editingFaq.answer}
                          onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateFaq(faq.id, editingFaq)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingFaq(null)}
                          className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-background/80 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary mb-1">{faq.question}</h3>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">{faq.answer}</p>
                          {faq.category && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary text-text rounded">
                              {faq.category}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={faq.isActive}
                              onChange={(e) => handleUpdateFaq(faq.id, { isActive: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                          <button
                            onClick={() => setEditingFaq(faq)}
                            className="px-3 py-1 text-sm bg-secondary text-text rounded-lg hover:bg-secondary/80 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

