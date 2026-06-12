import { type GetServerSideProps } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  return (
    <Default
      className="bg-[#6b5e50]"
      meta={
        <Meta
          title="All Crypto Opportunities | Web3 Bounties & Jobs | Future of Work"
          description="Browse all crypto bounties, web3 jobs, and Solana opportunities. Find remote work in blockchain development, design, content, and more. Earn cryptocurrency for your skills."
          canonical="https://superteam.fun/earn/all/"
          og={ASSET_URL + `/og/og.png`}
        />
      }
    >
      <HomepagePop />
      <div className="mx-auto w-full px-4 lg:px-12">
        <div className="mx-auto w-full max-w-[88rem]">
          <ListingsSection
            type="all"
            browseVariant="daybreak"
            potentialSession={potentialSession}
          />
        </div>
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';

  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  return { props: { potentialSession: cookieExists } };
};
