import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

const COLS = 'grid-cols-[1.7fr_0.9fr_1.6fr_auto]';

export const MembersTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#E6DCC9] bg-[#FFFDF8] shadow-[0_28px_80px_-58px_rgba(54,38,22,0.55)]">
      <div
        className={cn(
          'font-secondary grid items-center gap-4 border-b border-[#E6DCC9] bg-[#FBF7EF] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-[#5C5147] uppercase',
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
            index !== rows - 1 && 'border-b border-[#E6DCC9]',
          )}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full bg-[#F2EAD9]" />
            <div>
              <Skeleton className="mb-1.5 h-3.5 w-32 bg-[#F2EAD9]" />
              <Skeleton className="h-3 w-20 bg-[#F2EAD9]" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full bg-[#F2EAD9]" />
          <Skeleton className="h-4 w-40 bg-[#F2EAD9]" />
          <div className="flex w-8 justify-end">
            <Skeleton className="size-8 rounded-md bg-[#F2EAD9]" />
          </div>
        </div>
      ))}
    </div>
  );
};
