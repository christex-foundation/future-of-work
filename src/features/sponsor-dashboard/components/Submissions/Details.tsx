import { useAtomValue } from 'jotai';
import { ExternalLink } from 'lucide-react';
import { type ReactNode } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { type Listing } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../../atoms';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
  isHackathonPage?: boolean;
}

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <p className="mt-1 mb-1.5 text-xs font-semibold tracking-[0.04em] text-[#6B5E50] uppercase">
    {children}
  </p>
);

const LinkCard = ({ label, href }: { label: string; href?: string | null }) => (
  <div className="mb-4">
    <FieldLabel>{label}</FieldLabel>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 rounded-xl border border-[#1d1815]/12 bg-[#F4EEE3] px-4 py-3 text-sm font-medium text-[#1D1815] transition-colors hover:border-[#1d1815]/25"
      >
        <span className="truncate">{href}</span>
        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[#CE4A2B]">
          Open <ExternalLink className="size-3.5" />
        </span>
      </a>
    ) : (
      <p className="text-sm font-medium text-[#1D1815]">-</p>
    )}
  </div>
);

export const Details = ({ bounty, isHackathonPage }: Props) => {
  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';

  return (
    <div className="flex max-h-[39.7rem] w-full">
      <ScrollArea
        className={cn(
          'flex flex-1 flex-col overflow-y-auto p-4',
          !isHackathonPage ? 'w-2/3' : 'w-full',
        )}
        type="auto"
      >
        {!isProject && (
          <>
            <LinkCard
              label="Main Submission"
              href={
                selectedSubmission?.link
                  ? getURLSanitized(selectedSubmission?.link)
                  : ''
              }
            />
            <LinkCard
              label="Tweet Link"
              href={
                selectedSubmission?.tweet
                  ? getURLSanitized(selectedSubmission?.tweet)
                  : ''
              }
            />
          </>
        )}
        {bounty?.compensationType !== 'fixed' && (
          <div className="mb-4">
            <FieldLabel>Ask</FieldLabel>
            <p className="font-serif text-2xl font-medium text-[#2C3A2E]">
              {selectedSubmission?.ask?.toLocaleString('en-us')}{' '}
              <span className="font-sans text-sm font-normal text-[#6B5E50]">
                {bounty?.token}
              </span>
            </p>
          </div>
        )}

        {selectedSubmission?.eligibilityAnswers &&
          selectedSubmission.eligibilityAnswers.map((answer: any) => (
            <InfoBox
              key={answer.question}
              label={answer.question}
              content={answer.answer}
              isHtml
            />
          ))}
        <InfoBox
          label="Anything Else"
          content={selectedSubmission?.otherInfo}
          isHtml
        />
      </ScrollArea>
      {!isHackathonPage && (
        <div className="w-1/3 max-w-[22.5rem] p-4">
          {selectedSubmission && !isHackathonPage && (
            <Notes key={selectedSubmission.id} slug={bounty?.slug} />
          )}
        </div>
      )}
    </div>
  );
};
