import { Skeleton } from '@/components/ui/skeleton';

import { HelpBanner } from './HelpBanner';

export const BannerSkeleton = () => {
  return (
    <div className="mb-6 flex w-full flex-col gap-4 xl:flex-row xl:items-center">
      <div className="w-full rounded-md border-2 border-[#1d1815] bg-[#FBF7EF] px-6 py-5 shadow-[5px_5px_0_#1d1815]">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex shrink-0 items-center gap-3 pb-1 lg:pb-0">
            <Skeleton className="h-12 w-12 rounded-md bg-[#E9E0CD]" />
            <div>
              <Skeleton className="h-5 w-32 bg-[#E9E0CD]" />
              <Skeleton className="mt-2 h-5 w-[170px] bg-[#E9E0CD]" />
            </div>
          </div>

          <div className="block h-0.5 w-full border-t border-[#e6dcc9] lg:h-14 lg:w-0.5 lg:border-r" />

          <div className="flex gap-6 xl:gap-4 2xl:gap-6">
            <div>
              <Skeleton className="h-4 w-16 bg-[#E9E0CD]" />
              <Skeleton className="mt-2 h-5 w-[72px] bg-[#E9E0CD]" />
            </div>
            <div>
              <Skeleton className="h-4 w-14 bg-[#E9E0CD]" />
              <Skeleton className="mt-2 h-5 w-[72px] bg-[#E9E0CD]" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 bg-[#E9E0CD]" />
              <Skeleton className="mt-2 h-5 w-[72px] bg-[#E9E0CD]" />
            </div>
          </div>
        </div>
      </div>

      <div className="xl:w-[60%] xl:max-w-[400px]">
        <HelpBanner />
      </div>
    </div>
  );
};
