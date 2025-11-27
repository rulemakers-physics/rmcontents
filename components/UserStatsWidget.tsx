// components/UserStatsWidget.tsx
import { UserData } from "@/types/user";
import { DocumentDuplicateIcon, CurrencyDollarIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function UserStatsWidget({ userData, activeRequestsCount }: { userData: UserData, activeRequestsCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 플랜 정보 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
           <DocumentDuplicateIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">Current Plan</p>
          <p className="text-lg font-bold text-slate-900">{userData.plan} Plan</p>
        </div>
      </div>

      {/* 요청서 코인 (Maker's Plan 전용) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
           <CurrencyDollarIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">Request Coins</p>
          <p className="text-lg font-bold text-slate-900">{userData.coins}개 남음</p>
        </div>
      </div>

      {/* 진행 중인 작업 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-green-50 rounded-lg text-green-600">
           <ClockIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold">In Progress</p>
          <p className="text-lg font-bold text-slate-900">{activeRequestsCount}건 진행 중</p>
        </div>
      </div>
    </div>
  );
}