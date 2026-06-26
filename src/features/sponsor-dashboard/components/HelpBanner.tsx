import posthog from 'posthog-js';

import MdOutlineChatBubbleOutline from '@/components/icons/MdOutlineChatBubbleOutline';
import { LocalImage } from '@/components/ui/local-image';
import { JTTG } from '@/constants/Telegram';

export const HelpBanner = () => {
  return (
    <div className="rounded-md border-2 border-[#1d1815] bg-[#FBF7EF] px-4 py-2 text-[#1d1815] shadow-[5px_5px_0_#1d1815] 2xl:bg-[#FBF7EF] 2xl:px-8 2xl:py-5">
      <a
        className="ph-no-capture no-underline"
        href={JTTG}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture('message pratik_sponsor')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 2xl:gap-0">
            <LocalImage
              className="mr-2 size-8 2xl:mr-3 2xl:size-[3.3rem]"
              alt="message pratik"
              src={'/assets/sponsor/jill.png'}
            />
            <div className="flex gap-2 2xl:block">
              <p className="text-sm font-semibold whitespace-nowrap text-[#1d1815] 2xl:text-base">
                Stuck somewhere?
              </p>
              <p className="text-sm font-semibold whitespace-nowrap text-[#ce4a2b] 2xl:text-base">
                Message Us
              </p>
            </div>
          </div>
          <MdOutlineChatBubbleOutline
            color="#1d1815"
            size={20}
            className="2xl:hidden"
          />
          <MdOutlineChatBubbleOutline
            color="#1d1815"
            size={24}
            className="hidden 2xl:block"
          />
        </div>
      </a>
    </div>
  );
};
