import Link from 'next/link';
import { useRouter } from 'next/router';

import { cn } from '@/utils/cn';

import { AllPostsIcon, HomeIcon, LeaderboardIcon, WinnersIcon } from './icons';

interface NavItemProps {
  name: string;
  icon: () => React.ReactNode;
  href: string;
  active: boolean;
}

const NavItem = ({ name, icon: Icon, href, active }: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      'flex items-center font-medium transition-colors',
      active ? 'text-[#C4502E]' : 'text-[#5C5147] hover:text-[#C4502E]',
    )}
  >
    <div className="flex h-9 w-9 items-center justify-center">
      <Icon />
    </div>
    <span className="mt-1">{name}</span>
  </Link>
);

export const FeedNav = () => {
  const { pathname } = useRouter();
  return (
    <div className="sticky top-14 hidden h-screen w-48 flex-none flex-col gap-3 border-r border-[#E6DCC9] pt-5 pr-5 lg:flex">
      <NavItem
        name="Homepage"
        icon={HomeIcon}
        href="/earn"
        active={pathname === '/earn'}
      />
      <NavItem
        name="Leaderboard"
        icon={LeaderboardIcon}
        href="/earn/leaderboard"
        active={pathname.startsWith('/earn/leaderboard')}
      />
      <NavItem
        name="Winners"
        icon={WinnersIcon}
        href="/earn/feed/winners"
        active={pathname.startsWith('/earn/feed/winners')}
      />
      <NavItem
        name="All Posts"
        icon={AllPostsIcon}
        href="/earn/feed"
        active={pathname === '/earn/feed'}
      />
    </div>
  );
};
