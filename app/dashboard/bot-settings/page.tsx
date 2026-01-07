'use client';

import { PromptEditor } from '@/components/PromptEditor';

export default function BotSettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración del Bot</h1>
      <div className="bg-panel border border-border rounded-md p-6">
        <PromptEditor />
      </div>
    </div>
  );
}

