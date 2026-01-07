'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Power, PowerOff, QrCode } from 'lucide-react';
import api from '@/lib/api';
import { useNotifications } from '@/lib/notifications';

interface WhatsAppStatus {
  connected: boolean;
  state: 'connecting' | 'connected' | 'disconnected';
  phoneNumber?: string;
}

interface QRResponse {
  qr: string | null;
  state: string;
}

export default function WhatsAppPage() {
  const { showSuccess, showError, showInfo } = useNotifications();
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    state: 'disconnected',
  });
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const response = await api.get<WhatsAppStatus>('/whatsapp/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error loading WhatsApp status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQR = async () => {
    try {
      const response = await api.get<QRResponse>('/whatsapp/qr');
      setQr(response.data.qr);
    } catch (error) {
      console.error('Error loading QR:', error);
    }
  };

  useEffect(() => {
    loadStatus();
    loadQR();

    // Poll for status updates every 3 seconds
    const interval = setInterval(() => {
      loadStatus();
      // Always try to load QR when connecting or disconnected (in case it appears)
      if (status.state === 'connecting' || status.state === 'disconnected') {
        loadQR();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status.state]);

  // Also load QR when status changes to connecting
  useEffect(() => {
    if (status.state === 'connecting') {
      // Load QR immediately and then poll more frequently
      loadQR();
      const qrInterval = setInterval(() => {
        loadQR();
      }, 2000);

      return () => clearInterval(qrInterval);
    }
  }, [status.state]);

  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/whatsapp/reconnect');
      showInfo(response.data?.message || 'Reconectando WhatsApp...');
      // Wait a bit longer for QR to be generated
      setTimeout(() => {
        loadStatus();
        loadQR();
        setActionLoading(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error reconnecting:', error);
      showError(error.response?.data?.message || 'Error al reconectar WhatsApp');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/whatsapp/disconnect');
      setStatus({ connected: false, state: 'disconnected' });
      setQr(null);
      showSuccess(response.data?.message || 'WhatsApp desconectado exitosamente');
      setActionLoading(false);
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      showError(error.response?.data?.message || 'Error al desconectar WhatsApp');
      setActionLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getStatusText = () => {
    switch (status.state) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-panel border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Estado de WhatsApp</h1>

        {/* Status Card */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Estado de Conexión</h2>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor().replace('text-', 'bg-')}`}></div>
                <span className={`font-medium ${getStatusColor()}`}>{getStatusText()}</span>
              </div>
            </div>
            {status.phoneNumber && (
              <div className="text-right">
                <p className="text-sm text-text-secondary">Número conectado</p>
                <p className="font-mono">{status.phoneNumber}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {status.state !== 'connected' && (
              <button
                onClick={handleReconnect}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw size={20} className={actionLoading ? 'animate-spin' : ''} />
                Reconectar
              </button>
            )}
            {status.state === 'connected' && (
              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                <PowerOff size={20} />
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* QR Code Card */}
        {status.state === 'connecting' && qr && (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={24} />
              <h2 className="text-lg font-semibold">Código QR para Conectar</h2>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="text-sm text-text-secondary text-center max-w-md">
                <p className="mb-2">1. Abre WhatsApp en tu teléfono</p>
                <p className="mb-2">2. Ve a Configuración → Dispositivos vinculados</p>
                <p className="mb-2">3. Toca &quot;Vincular un dispositivo&quot;</p>
                <p>4. Escanea el código QR que aparece arriba</p>
              </div>
            </div>
          </div>
        )}

        {status.state === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800">
              ✅ WhatsApp está conectado y funcionando correctamente
            </p>
            {status.phoneNumber && (
              <p className="text-sm text-green-600 mt-2">
                Número: {status.phoneNumber}
              </p>
            )}
          </div>
        )}

        {status.state === 'disconnected' && !qr && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 mb-4">
              ⚠️ WhatsApp está desconectado. Haz clic en &quot;Reconectar&quot; para iniciar la conexión y generar un nuevo código QR.
            </p>
            <button
              onClick={handleReconnect}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 mx-auto"
            >
              <RefreshCw size={20} className={actionLoading ? 'animate-spin' : ''} />
              Reconectar y Generar QR
            </button>
          </div>
        )}

        {/* Show QR even when disconnected if it exists (during reconnection) */}
        {status.state === 'disconnected' && qr && (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={24} />
              <h2 className="text-lg font-semibold">Código QR para Reconectar</h2>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="text-sm text-text-secondary text-center max-w-md">
                <p className="mb-2">1. Abre WhatsApp en tu teléfono</p>
                <p className="mb-2">2. Ve a Configuración → Dispositivos vinculados</p>
                <p className="mb-2">3. Toca &quot;Vincular un dispositivo&quot;</p>
                <p>4. Escanea el código QR que aparece arriba</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

