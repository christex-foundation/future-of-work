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
        className="ph-no-capture flex w-fit items-center gap-2 rounded-full border border-transparent bg-[#2C3A2E] px-[22px] py-[12px] text-[14.5px] font-semibold whitespace-nowrap text-[#FBF7EF] transition-all duration-200 hover:-translate-y-px hover:bg-[#3C4D3D] hover:text-[#FBF7EF] hover:no-underline hover:shadow-[0_8px_24px_-12px_rgba(34,26,20,0.5)]"
      >
        View all opportunities <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
};
