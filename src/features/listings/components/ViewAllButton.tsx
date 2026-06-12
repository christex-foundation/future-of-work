import Link from 'next/link';
import posthog from 'posthog-js';

export const ViewAllButton = ({
  posthogEvent,
  href,
}: {
  posthogEvent: string;
  href: string;
}) => {
  return (
    <div className="mt-8 mb-2 flex justify-center">
      <Link
        href={href}
        onClick={() => posthog.capture(posthogEvent)}
        className="ph-no-capture font-secondary flex w-fit items-center gap-2 rounded-md border-2 border-[#1d1815] bg-[#f4eee3] px-6 py-3 text-[12px] font-bold tracking-[0.1em] text-[#1d1815] uppercase shadow-[4px_4px_0_#1d1815] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#f4eee3] hover:no-underline hover:shadow-[6px_6px_0_#1d1815]"
      >
        View all opportunities &rarr;
      </Link>
    </div>
  );
};
