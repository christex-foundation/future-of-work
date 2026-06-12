import { usePrivy } from '@privy-io/react-auth';
import { useAtom, useSetAtom } from 'jotai';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTimeout } from '@/hooks/use-timeout';
import { cn } from '@/utils/cn';

import {
  CONVERSION_POPUPS_ENABLED,
  popupOpenAtom,
  popupsShowedAtom,
  popupTimeoutAtom,
} from '../atoms';
import { GetStarted } from './GetStarted';

interface GrantInfo {
  title: string;
  description: string;
  icon: string;
}
const grantInfo: GrantInfo = {
  title: 'Ready to build out your next idea?',
  description:
    'Apply to grants worth thousands of dollars with a single profile.',
  icon: ASSET_URL + '/icons/bank-2.png',
};

export const GrantsPop = () => {
  const [popupsShowed, setPopupsShowed] = useAtom(popupsShowedAtom);
  const setPopupTimeout = useSetAtom(popupTimeoutAtom);

  const [open, setOpen] = useAtom(popupOpenAtom);
  const { authenticated, ready } = usePrivy();

  const timeoutHandle = useTimeout(() => {
    setOpen(true);
    setPopupsShowed((s) => s + 1);
    posthog.capture('conversion pop up_initiated', {
      'Popup Source': 'Grants Pop-up',
    });
  }, 7_000);

  const isMD = useBreakpoint('md');

  const initated = useRef(false); // only run use effect once
  useEffect(() => {
    if (
      !initated.current &&
      ready &&
      !authenticated &&
      popupsShowed < 1 &&
      !open &&
      CONVERSION_POPUPS_ENABLED &&
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ) {
      initated.current = true;
      setTimeout(() => {
        timeoutHandle.start();
        setPopupTimeout(timeoutHandle);
      }, 0);
    }
  }, [ready, authenticated]);

  const setPopupOpen = (e: boolean) => {
    if (e === false) {
      posthog.capture('conversion pop up_closed', {
        'Popup Source': 'Grants Pop-up',
      });
    }
    setOpen(e);
  };

  if (!isMD) {
    return <Mobile open={open} setOpen={setPopupOpen} variant={grantInfo} />;
  }

  return <Desktop open={open} setOpen={setPopupOpen} variant={grantInfo} />;
};

const Mobile = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  variant: GrantInfo;
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent
        classNames={{
          overlay: isLoginOpen ? 'z-200' : '',
        }}
        className="border-t-2! border-[#1d1815]! bg-[#FBF7EE] ring-0!"
      >
        <DrawerHeader className="text-left">
          <img
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
            width={48}
            height={48}
            className="w-12 rounded-none border-2 border-[#1d1815] object-contain"
          />
          <DrawerTitle className="font-serif pt-2 text-lg font-semibold text-[#1d1815]">
            {variant?.title}
          </DrawerTitle>
          <DrawerDescription className="font-primary text-sm text-[#6b5e50]">
            {variant?.description}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-0">
          <GetStarted setIsLoginOpen={setIsLoginOpen} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const Desktop = ({
  open,
  setOpen,
  variant,
}: {
  open: boolean;
  setOpen: (e: boolean) => void;
  variant: GrantInfo;
}) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          'max-w-[23rem] overflow-hidden rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] p-5 shadow-[6px_6px_0_#1d1815]',
          isLoginOpen && 'invisible',
        )}
        hideCloseIcon
      >
        <DialogHeader className="">
          <img
            src={variant?.icon || ''}
            alt={`${variant?.title}`}
            width={48}
            height={48}
            className="w-12 rounded-none border-2 border-[#1d1815] object-contain"
          />
          <DialogTitle className="font-serif pt-2 text-lg font-semibold text-[#1d1815]">
            {variant?.title}
          </DialogTitle>
          <DialogDescription className="font-primary text-sm text-[#6b5e50]">
            {variant?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="">
          <GetStarted setIsLoginOpen={setIsLoginOpen} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
