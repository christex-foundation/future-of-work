import { usePrivy } from '@privy-io/react-auth';
import { ArrowUpRight, Compass, FileCheck2, Wallet } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'fow-welcome-seen';

const STEPS = [
  {
    icon: Compass,
    title: 'Browse opportunities',
    body: 'Bounties, projects and quests from real sponsors — find work that fits your skills.',
    accent: '#9A6A10',
    wash: 'rgba(230,161,43,0.18)',
  },
  {
    icon: FileCheck2,
    title: 'Submit your work',
    body: 'Apply or send your submission directly. No gatekeeping, no middlemen.',
    accent: '#A6371C',
    wash: 'rgba(206,74,43,0.14)',
  },
  {
    icon: Wallet,
    title: 'Get paid',
    body: 'Win and get rewarded in crypto, straight to your wallet.',
    accent: '#123A33',
    wash: 'rgba(18,58,51,0.12)',
  },
];

export const WelcomeModal = () => {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Only greet first-time, logged-out visitors, and only once.
    if (authenticated) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    setOpen(true);
  }, [ready, authenticated]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setOpen(false);
  };

  const handleGetStarted = () => {
    dismiss();
    // The global Header opens the login/sign-up modal when a `login` param is
    // present, so route there rather than prop-drilling the disclosure.
    router.push('/earn?login=true', undefined, { shallow: true });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent
        className="overflow-hidden border-[#221A1417] bg-[#FBF7EF] p-0 sm:max-w-md sm:rounded-[24px]"
        classNames={{ closeIcon: 'text-[#6B5E50]' }}
      >
        <div className="p-7">
          <span className="font-secondary inline-flex items-center gap-2 rounded-full bg-[rgba(230,161,43,0.18)] px-[11px] py-[6px] text-[10.5px] font-bold tracking-[0.14em] text-[#9A6A10] uppercase">
            <span className="size-2 rounded-[3px] bg-[#E6A12B]" />
            Welcome
          </span>

          <DialogTitle className="font-serif mt-4 text-[26px] leading-[1.12] font-semibold tracking-[-0.01em] text-[#1D1815]">
            Get paid for the work you do
          </DialogTitle>
          <DialogDescription className="font-secondary mt-2 text-[13.5px] leading-relaxed text-[#6B5E50]">
            Future of Work connects Sierra Leonean talent with real, paid
            opportunities. Here&apos;s how it works.
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-3.5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3.5">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-2xl"
                    style={{ background: step.wash, color: step.accent }}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <div>
                    <p className="font-serif text-[15px] font-semibold text-[#1D1815]">
                      {step.title}
                    </p>
                    <p className="font-secondary text-[12.5px] leading-snug text-[#6B5E50]">
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <Button
              className="h-11 w-full rounded-full bg-[#1D1815] text-[14px] font-semibold text-[#FBF7EF] hover:bg-[#1D1815]/90"
              onClick={handleGetStarted}
            >
              Get started
              <ArrowUpRight className="size-4" />
            </Button>
            <button
              onClick={dismiss}
              className="font-secondary text-[12.5px] font-semibold text-[#6B5E50] hover:text-[#1D1815]"
            >
              I&apos;ll explore first
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
