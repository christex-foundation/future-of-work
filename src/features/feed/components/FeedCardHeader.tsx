import { useRouter } from 'next/router';

import { timeAgoShort } from '@/utils/timeAgo';

interface FeedCardHeaderProps {
  name: string;
  username?: string;
  action: string;
  description?: string;
  photo: string | undefined;
  createdAt: string;
  type: 'activity' | 'profile';
}

export const FeedCardHeader = ({
  name,
  username,
  action,
  description,
  createdAt,
  type,
}: FeedCardHeaderProps) => {
  const router = useRouter();
  if (type === 'profile') {
    return (
      <div className="-mt-0.5 -mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-slate-400 md:text-base">
              <span className="font-semibold text-slate-800">{name}</span>{' '}
              {action}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-400 md:text-sm">
            {timeAgoShort(createdAt)}
          </p>
        </div>
        <p className="text-sm break-all text-slate-500 md:text-base">
          {description}
        </p>
      </div>
    );
  }
  const a = action.toLowerCase();
  let tag = { label: 'Submission', cls: 'text-[#6B7A4F]' };
  if (a.includes('won') || a.includes('selected') || a.includes('grant')) {
    tag = { label: 'Win', cls: 'text-[#A83F22]' };
  } else if (a.includes('applied')) {
    tag = { label: 'Project', cls: 'text-[#2C3A2E]' };
  } else if (a.includes('personal project')) {
    tag = { label: 'Proof of work', cls: 'text-[#6B7A4F]' };
  }

  return (
    <div className="-mt-0.5 flex w-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <p
          className="cursor-pointer text-sm font-semibold text-[#221A14] hover:underline md:text-base"
          onClick={() => router.push(`/earn/t/${username}`)}
        >
          {name}
        </p>
        <span
          className={`mt-0.5 inline-flex flex-none items-center rounded-full border border-[#E6DCC9] bg-[#F2EAD9] px-2.5 py-[3px] text-[10.5px] font-bold tracking-[0.1em] uppercase ${tag.cls}`}
        >
          {tag.label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <p
          className="cursor-pointer text-xs font-medium text-[#5C5147] hover:underline md:text-sm"
          onClick={() => router.push(`/earn/t/${username}`)}
        >
          @{username}
        </p>
        <p className="text-xs font-medium text-[#5C5147] md:text-sm">
          • {timeAgoShort(createdAt)}
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-[#5C5147] md:text-base">
        {action}
      </p>
    </div>
  );
};
