// src/app/(staff)/staff/tables/_components/TableCard.tsx
import { TableDto } from "@/services/table";
import { STATUS_CONFIG } from "../page";

interface TableCardProps {
  table: TableDto;
  onClick: (table: TableDto) => void;
}

export const TableCard = ({ table, onClick }: TableCardProps) => {
  const cfg = STATUS_CONFIG[table.status];
  const orderCount = table.activeOrders.length;

  return (
    <button
      onClick={() => onClick(table)}
      className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md active:scale-[0.97] ${cfg.bgColor} ${cfg.borderColor}`}
    >
      {/* status dot */}
      <div className="flex items-center justify-between mb-3">
        <span className={`size-2.5 rounded-full ${cfg.dot}`} />
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.textColor}`}
        >
          {cfg.label}
        </span>
      </div>

      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
        {table.name}
      </p>

      {table.area && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {table.area}
        </p>
      )}

      {table.status === "OCCUPIED" && orderCount > 0 && (
        <p className={`text-xs font-semibold mt-2 ${cfg.textColor}`}>
          {orderCount} đơn đang xử lý
        </p>
      )}
    </button>
  );
};
