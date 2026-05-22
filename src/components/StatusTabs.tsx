'use client';

interface StatusTabsProps {
  activeTab: 'Pending' | 'Resolved';
  setActiveTab: (tab: 'Pending' | 'Resolved') => void;
  pendingCount: number;
  resolvedCount: number;
}

export default function StatusTabs({ activeTab, setActiveTab, pendingCount, resolvedCount }: StatusTabsProps) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        onClick={() => setActiveTab('Pending')}
        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'Pending'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        Chưa xử lý ({pendingCount})
      </button>
      <button
        onClick={() => setActiveTab('Resolved')}
        className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'Resolved'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
      >
        Đã xử lý ({resolvedCount})
      </button>
    </div>
  );
}