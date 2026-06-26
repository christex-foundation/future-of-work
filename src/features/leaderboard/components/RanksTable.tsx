import 'flag-icons/css/flag-icons.min.css';

import Link from 'next/link';
import posthog from 'posthog-js';

import { UserFlag } from '@/components/shared/UserFlag';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type RowType, type SKILL } from '../types';
import { getSubskills, skillCategories } from '../utils';

const headCls =
  'px-1 text-xs font-semibold tracking-[0.1em] text-[#5C5147] uppercase md:px-3';

const Chip = ({ label }: { label: string }) => (
  <span className="rounded-full bg-[#8FA37E]/16 px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-[#2C3A2E]">
    {label}
  </span>
);

const SkillChips = ({ skills }: { skills: string[] }) => (
  <div className="flex h-full gap-2 text-center">
    {skills.slice(0, 2).map((s) => (
      <Chip key={s} label={s} />
    ))}
    {skills.length > 2 && (
      <Popover>
        <PopoverTrigger>
          <span className="rounded-full bg-[#8FA37E]/16 px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-[#2C3A2E]">
            +{skills.length - 2}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-fit max-w-40 border-[#E6DCC9] px-4 py-2 shadow-lg"
          align="center"
        >
          <div className="flex h-full w-fit flex-wrap gap-2 text-center">
            {skills.slice(2).map((s) => (
              <Chip key={s} label={s} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )}
  </div>
);

interface Props {
  rankings: RowType[];
  skill: SKILL;
  userRank: RowType | null;
  loading: boolean;
  search: string;
}

export function RanksTable({
  rankings,
  skill,
  userRank,
  loading,
  search,
}: Props) {
  const { user } = useUser();

  const userSkills = getSubskills(user?.skills as any, skillCategories[skill]);

  const skillColCls = cn(
    'px-1 md:px-3',
    skill !== 'ALL' ? 'hidden' : 'hidden md:table-cell',
  );

  return (
    <div
      className={cn(
        'hide-scrollbar relative w-full overflow-x-auto rounded-2xl border border-[#E6DCC9] bg-[#FBF7EF] shadow-[0_12px_34px_-22px_rgba(54,38,22,0.3)]',
        rankings.length === 0 ? 'h-[35rem]' : 'h-auto',
        loading ? 'opacity-30' : 'opacity-100',
      )}
    >
      {rankings.length === 0 && (
        <div className="absolute top-40 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F2EAD9]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_482_662)">
                <path
                  d="M16 11V3H8V9H2V21H22V11H16ZM10 5H14V19H10V5ZM4 11H8V19H4V11ZM20 19H16V13H20V19Z"
                  fill="#5C5147"
                />
              </g>
              <defs>
                <clipPath id="clip0_482_662">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col gap-1 text-xs font-medium text-[#221A14]">
            <p>
              {search.length > 0
                ? `We couldn't find anything for '${search}'`
                : 'The Leaderboard is empty for your filter'}
            </p>
            <p className="text-[#5C5147]">
              {search.length > 0
                ? 'Try a different search query or checking your spelling'
                : 'Please change your filter or try again later'}
            </p>
          </div>
        </div>
      )}
      <Table>
        <TableHeader className="bg-[#F2EAD9]">
          <TableRow className="border-[#E6DCC9] normal-case hover:bg-transparent">
            <TableHead className={cn(headCls, 'text-center')}>Rank</TableHead>
            <TableHead className={cn(headCls, 'text-left')}>Builder</TableHead>
            <TableHead className={cn(headCls, 'text-right')}>
              <span className="hidden whitespace-nowrap md:inline">
                Dollars Earned
              </span>
              <span className="inline whitespace-nowrap md:hidden">
                $ Earned
              </span>
            </TableHead>
            <TableHead className={cn(headCls, 'text-center whitespace-nowrap')}>
              Win Rate
            </TableHead>
            <TableHead className={cn(headCls, 'text-center')}>Wins</TableHead>
            <TableHead
              className={cn(
                headCls,
                'max-w-[3.5rem] truncate overflow-x-hidden text-center md:max-w-none',
              )}
            >
              Subs
            </TableHead>
            <TableHead className={cn(headCls, 'text-left', skillColCls)}>
              Skills
            </TableHead>
          </TableRow>
        </TableHeader>

        {rankings.length > 0 && (
          <TableBody className="text-sm text-[#5C5147]">
            {rankings.map((row) => {
              const isTop = row.rank <= 3;
              const isMe = row.username === user?.username;
              return (
                <TableRow
                  key={row.username}
                  className={cn(
                    'group h-full border-[#E6DCC9] transition-colors',
                    isMe ? 'bg-[#FBEEE6]' : 'hover:bg-[#F2EAD9]/60',
                  )}
                >
                  <TableCell className="h-full px-1 text-center md:px-3">
                    <span
                      className={cn(
                        'font-serif text-[20px] tabular-nums',
                        isTop ? 'text-[#C4502E]' : 'text-[#221A14]',
                      )}
                    >
                      {row.rank}
                    </span>
                  </TableCell>
                  <TableCell className="h-full pr-8 sm:px-3">
                    <Link
                      href={`/earn/t/${row.username}`}
                      target="_blank"
                      className="ph-no-capture flex items-center gap-2.5"
                      onClick={() => {
                        posthog.capture('profile click_leaderboard', {
                          clicked_username: row.username,
                        });
                      }}
                    >
                      <EarnAvatar avatar={row.pfp!} id={row.name} />
                      <div className="flex flex-col items-start justify-center gap-0.5 md:justify-start">
                        <p className="block max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap font-semibold text-[#221A14] group-hover:underline md:hidden">
                          {row.name.split(' ')[0] +
                            ' ' +
                            row.name.split(' ')[1]?.slice(0, 1).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="hidden overflow-x-hidden text-ellipsis whitespace-nowrap font-semibold text-[#221A14] group-hover:underline md:block">
                            {row.name}
                          </p>
                          {row.location && (
                            <UserFlag size="12px" location={row.location} />
                          )}
                        </div>
                        <p className="hidden max-w-[7rem] truncate text-[12.5px] text-[#5C5147] md:block">
                          @{row.username}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="h-full px-1 md:px-3">
                    <div className="flex items-baseline justify-end gap-1 text-right">
                      <p className="font-serif text-[19px] tracking-[-0.01em] text-[#C4502E] tabular-nums">
                        ${formatNumberWithSuffix(row.dollarsEarned)}
                      </p>
                      <p className="hidden text-[11px] font-semibold text-[#5C5147] md:block">
                        USDC
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="h-full px-1 text-center md:px-3">
                    <span className="inline-block rounded-full bg-[#8FA37E]/20 px-2.5 py-1 text-[12px] font-semibold text-[#2C3A2E]">
                      {row.winRate}%
                    </span>
                  </TableCell>
                  <TableCell className="h-full px-1 text-center text-[15px] font-semibold text-[#221A14] tabular-nums md:px-3">
                    {row.wins}
                  </TableCell>
                  <TableCell className="h-full px-1 text-center text-[15px] font-semibold text-[#221A14] tabular-nums md:px-3">
                    {row.submissions}
                  </TableCell>
                  <TableCell className={cn('h-full', skillColCls)}>
                    <SkillChips skills={row.skills} />
                  </TableCell>
                </TableRow>
              );
            })}
            {user && !rankings.find((r) => r.username === user?.username) && (
              <TableRow className="w-full border-t-2 border-[#C4502E] bg-gradient-to-b from-[#fbeee6] to-[#f7e4d8] hover:bg-transparent">
                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-3">
                  <span className="font-serif text-[20px] text-[#C4502E] tabular-nums">
                    {userRank ? userRank.rank : '–'}
                  </span>
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 md:px-3">
                  <Link
                    className="ph-no-capture flex items-center gap-2.5"
                    href={`/earn/t/${user.username}`}
                    onClick={() => {
                      posthog.capture('profile click_leaderboard', {
                        clicked_username: user.username,
                      });
                    }}
                    target="_blank"
                  >
                    <EarnAvatar avatar={user.photo} id={user.firstName} />
                    <div className="flex flex-col items-start justify-center gap-0.5 md:justify-start">
                      <p className="block max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap font-semibold text-[#221A14] md:hidden">
                        {user.firstName +
                          ' ' +
                          user.lastName?.slice(0, 1).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="line-clamp-1 hidden max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap font-semibold text-[#221A14] md:block">
                          {user.firstName + ' ' + user.lastName}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-[#C4502E] px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] text-white uppercase">
                          You
                        </span>
                        {user.location && (
                          <UserFlag size="12px" location={user.location} />
                        )}
                      </div>
                      <p className="hidden max-w-[7rem] overflow-x-hidden text-ellipsis text-[12.5px] text-[#5C5147] md:block">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 md:px-3">
                  <div className="flex items-baseline justify-end gap-1 text-right">
                    <p className="font-serif text-[19px] tracking-[-0.01em] text-[#C4502E] tabular-nums">
                      ${formatNumberWithSuffix(userRank?.dollarsEarned ?? 0)}
                    </p>
                    <p className="hidden text-[11px] font-semibold text-[#5C5147] md:block">
                      USDC
                    </p>
                  </div>
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-3">
                  {userRank?.winRate != null ? (
                    <span className="inline-block rounded-full bg-[#8FA37E]/20 px-2.5 py-1 text-[12px] font-semibold text-[#2C3A2E]">
                      {userRank.winRate}%
                    </span>
                  ) : (
                    '–'
                  )}
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center text-[15px] font-semibold text-[#221A14] tabular-nums md:px-3">
                  {userRank?.wins ?? '–'}
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center text-[15px] font-semibold text-[#221A14] tabular-nums md:px-3">
                  {userRank?.submissions ?? '–'}
                </TableCell>

                <TableCell
                  className={cn(
                    'sticky bottom-0 border-b-0',
                    skillColCls,
                  )}
                >
                  <SkillChips skills={userSkills} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
