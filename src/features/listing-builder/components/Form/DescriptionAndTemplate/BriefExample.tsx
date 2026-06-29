import { BookOpenText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * A read-only, fully-worked sample brief that shows companies what a strong
 * Overview / Requirements / Judging Criteria looks like. Triggered next to the
 * Description label.
 */
export function BriefExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[#2C3A2E] hover:bg-[#EEF1E7] hover:text-[#2C3A2E]"
        >
          <BookOpenText className="text-[#2C3A2E]" />
          <span>See an example</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[min(720px,calc(100vw-4rem))] max-w-none rounded-lg border-[#E6DCC9] bg-[#FFFDF8] p-0 text-[#221A14] shadow-[0_28px_80px_rgba(34,26,20,0.22)]"
      >
        <div className="border-b border-[#E6DCC9] bg-[#FBF7EF] px-7 py-6">
          <DialogHeader className="space-y-2">
            <p className="text-xs font-bold tracking-[0.18em] text-[#C4502E] uppercase">
              Example brief
            </p>
            <DialogTitle className="font-serif text-2xl font-semibold text-[#221A14]">
              What a strong brief looks like
            </DialogTitle>
            <DialogDescription className="max-w-xl text-[#5C5147]">
              A good brief covers three sections. Here&apos;s a worked example
              for a short-form video bounty.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 px-7 py-6 text-sm text-[#3A322A]">
            <section className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#221A14]">
                Overview
              </h3>
              <p className="text-[#5C5147]">
                <span className="font-medium text-[#3A322A]">
                  Give as much detail as possible — explain everything you want.
                </span>{' '}
                We&apos;re looking for creators to make a short, engaging video
                that explains what ClapMi does and why it matters for everyday
                users on Solana. Cover the problem we solve, how the product
                works, and who it&apos;s for. Brand assets, logos, and product
                screenshots are linked at the bottom of this brief.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#221A14]">
                Requirements
              </h3>
              <p className="text-[#5C5147]">
                What is required of participants for a submission to be valid and
                eligible for rewards:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-[#5C5147]">
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Video length:
                  </span>{' '}
                  no limits.
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Where to post:
                  </span>{' '}
                  publicly on X, Instagram, and TikTok. Tag ClapMi and
                  SuperteamNG&apos;s official accounts on every platform.
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Cross-platform linking:
                  </span>{' '}
                  include your IG &amp; TikTok links in the second or third tweet
                  of your X submission, kept together in one thread.
                </li>
                <li>Keep content practical, engaging, and easy to understand.</li>
                <li>
                  <span className="font-medium text-[#3A322A]">Language:</span>{' '}
                  English.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-[#221A14]">
                Judging Criteria
              </h3>
              <p className="text-[#5C5147]">What the work will be scored on:</p>
              <ul className="list-disc space-y-1 pl-5 text-[#5C5147]">
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Creativity &amp; originality:
                  </span>{' '}
                  how unique and inventive is the concept?
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Project representation:
                  </span>{' '}
                  how well does the video explain or showcase the theme?
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Completeness:
                  </span>{' '}
                  does it cover all the required points?
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">Engagement:</span>{' '}
                  does it capture attention and keep people interested?
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">Relevance:</span>{' '}
                  how effectively does it connect the project with Solana?
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">Quality:</span>{' '}
                  production quality, editing, visuals, and audio.
                </li>
                <li>
                  <span className="font-medium text-[#3A322A]">
                    Clarity &amp; impact:
                  </span>{' '}
                  is the message easy to understand and memorable?
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
