'use client';

import { BotConfigEditor } from '@/components/BotConfigEditor';

export default function BotSettingsPage() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-background">
      <div className="w-full">
        <BotConfigEditor />
      </div>
    </div>
  );
}

