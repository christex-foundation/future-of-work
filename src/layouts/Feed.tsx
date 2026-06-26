import React from 'react';

import { Home } from '@/layouts/Home';

import { FeedNav } from '@/features/feed/components/FeedNav';

interface FeedPageProps {
  children: React.ReactNode;
  isHomePage?: boolean;
  meta?: React.ReactNode;
}

export const FeedPageLayout = ({ children, meta }: FeedPageProps) => {
  return (
    <Home type="feed" meta={meta}>
      <div className="-mt-4 -mr-[10px] -ml-5 border-r border-[#E6DCC9] bg-[#FBF7EF] lg:-mr-[25px] lg:ml-0">
        <div className="flex">
          <FeedNav />
          <div className="flex w-full flex-col lg:max-w-[44rem]">
            {children}
          </div>
        </div>
      </div>
    </Home>
  );
};
