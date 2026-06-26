import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { useExternalLinkDialog } from '@/components/shared/ExternalLinkDialogProvider';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

export const FeedCardLink = ({
  href,
  style,
  children,
}: {
  href: string | undefined;
  style?: React.HTMLAttributes<HTMLDivElement>['className'];
  children: ReactNode;
}) => {
  const { handleExternalLinkClick } = useExternalLinkDialog();
  const sanitizedHref = getURLSanitized(href ?? '#');

  return (
    <div
      className={cn(
        'group-hover:underline-none flex items-center gap-2 whitespace-nowrap',
        style,
      )}
    >
      <Link
        href={sanitizedHref}
        rel="noopener noreferrer"
        target="_blank"
        className="flex items-center gap-3 hover:underline hover:decoration-[#C4502E] hover:underline-offset-2"
        onClick={(event) => handleExternalLinkClick(event, sanitizedHref)}
      >
        <span className="text-xs font-semibold text-[#C4502E] md:text-base">
          {children}
        </span>
        <ArrowRight className="hidden h-4 w-4 text-[#C4502E] sm:block" />
      </Link>
    </div>
  );
};
