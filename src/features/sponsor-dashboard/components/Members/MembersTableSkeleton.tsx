import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

const COLS = 'grid-cols-[1.7fr_0.9fr_1.6fr_auto]';

export const MembersTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-[#1d1815] bg-[#f4eee3] shadow-[5px_5px_0_#1d1815]">
      <div
        className={cn(
          'font-secondary grid items-center gap-4 border-b-2 border-[#1d1815] bg-[#ECE2D2] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-[#6b5e50] uppercase',
          COLS,
        )}
      >
        <span>Member</span>
        <span>Role</span>
        <span>Email</span>
        <span className="w-8" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'grid items-center gap-4 px-5 py-4',
            COLS,
            index !== rows - 1 && 'border-b border-dashed border-[#1d1815]/25',
          )}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-md bg-[#1d1815]/10" />
            <div>
              <Skeleton className="mb-1.5 h-3.5 w-32 bg-[#1d1815]/10" />
              <Skeleton className="h-3 w-20 bg-[#1d1815]/10" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-md bg-[#1d1815]/10" />
          <Skeleton className="h-4 w-40 bg-[#1d1815]/10" />
          <div className="flex w-8 justify-end">
            <Skeleton className="size-8 rounded-md bg-[#1d1815]/10" />
          </div>
        </div>
      ))}
    </div>
  );
};
