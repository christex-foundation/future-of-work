import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedPageLayout } from '@/layouts/Feed';
import { cn } from '@/utils/cn';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';

import { useGetFeed } from '../queries/useGetFeed';
import { type FeedPostType } from '../types';
import { FeedLoop } from './FeedLoop';

interface Props {
  type?: FeedPostType;
  id?: string;
  isWinner?: boolean;
  meta?: React.ReactNode;
}

interface MenuOptionProps {
  option: 'new' | 'popular';
  activeMenu: 'new' | 'popular';
  onSelect: (option: 'new' | 'popular') => void;
}

const MenuOption = ({ option, activeMenu, onSelect }: MenuOptionProps) => {
  return (
    <button
      className={cn(
        'cursor-pointer capitalize',
        'text-sm lg:text-base',
        activeMenu === option
          ? 'font-semibold text-[#C4502E]'
          : 'font-normal text-[#5C5147] hover:text-[#221A14]',
      )}
      onClick={() => onSelect(option)}
    >
      {option}
    </button>
  );
};

export const Feed = ({ isWinner = false, id, type, meta }: Props) => {
  const router = useRouter();
  const { query } = router;

  const activeMenu = (query.filter as 'new' | 'popular') || 'popular';
  const [timePeriod, setTimePeriod] = useState('This Month');

  const { ref, inView } = useInView();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetFeed({
      filter: activeMenu,
      timePeriod:
        activeMenu === 'popular' ? timePeriod.toLowerCase() : undefined,
      isWinner,
      take: 15,
      highlightId: id,
      highlightType: type,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleMenuSelect = (option: 'new' | 'popular') => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...query, filter: option },
      },
      undefined,
      { shallow: true },
    );
  };

  const feedItems = data?.pages.flatMap((page) => page) ?? [];

  return (
    <FeedPageLayout isHomePage meta={meta}>
      <HomepagePop />
      <div className="border-b border-[#E6DCC9] py-5 pr-2 pl-6 md:pl-5">
        <span className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.2em] text-[#6B7A4F] uppercase before:h-[1.5px] before:w-[18px] before:bg-[#6B7A4F] before:content-['']">
          Activity
        </span>
        <p className="mt-2 font-serif text-[26px] leading-[1.05] font-normal tracking-[-0.01em] text-[#221A14] lg:text-[30px]">
          Your community, at work
        </p>
        <p className="mt-1 text-[15px] text-[#5C5147]">
          Every win, submission and project — as it happens.
        </p>
        <div className="mt-4 flex w-full items-center justify-between">
          <div className="mr-3 flex gap-3">
            <MenuOption
              option="new"
              activeMenu={activeMenu}
              onSelect={handleMenuSelect}
            />
            <MenuOption
              option="popular"
              activeMenu={activeMenu}
              onSelect={handleMenuSelect}
            />
          </div>

          {activeMenu === 'popular' && (
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="mr-1 h-6 w-28 rounded-full border-[#E6DCC9] bg-[#F2EAD9] text-right text-xs font-semibold text-[#5C5147] sm:h-8">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="text-[#5C5147]">
                <SelectItem className="text-xs" value="This Week">
                  This Week
                </SelectItem>
                <SelectItem className="text-xs" value="This Month">
                  This Month
                </SelectItem>
                <SelectItem className="text-xs" value="This Year">
                  This Year
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="px-4 py-5 md:px-5">
        <FeedLoop
          feed={feedItems}
          ref={ref}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          type="activity"
        >
          <div className="my-32">
            <ExternalImage
              className="mx-auto w-32"
              src={'/bg/talent-empty.svg'}
              alt="talent empty"
            />
            <p className="mx-auto mt-5 w-[220px] text-center font-serif text-[22px] text-[#221A14]">
              No activity found
            </p>
            <p className="mx-auto mt-1 text-center text-sm text-[#5C5147] md:text-base">
              We couldn’t find any activity for your time filter.
            </p>
          </div>
        </FeedLoop>
      </div>
    </FeedPageLayout>
  );
};
