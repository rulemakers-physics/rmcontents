// components/EmptyState.tsx
import Link from "next/link";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function EmptyState({ title, desc, actionLink, actionText }: any) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <ClipboardDocumentListIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 mb-6">{desc}</p>
      <Link 
        href={actionLink}
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
      >
        {actionText}
      </Link>
    </div>
  );
}