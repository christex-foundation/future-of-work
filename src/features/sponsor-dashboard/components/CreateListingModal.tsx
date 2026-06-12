import { Cross2Icon } from '@radix-ui/react-icons';
import { motion } from 'motion/react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

import { getVisibleHackathons } from '@/features/hackathon/utils/getVisibleHackathons';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
  hackathons,
}: {
  isOpen: boolean;
  onClose: () => void;
  hackathons?: HackathonModel[];
}) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      router.prefetch('/earn/dashboard/new');
    }
  }, [isOpen, router]);

  const handleCreateBounty = () => {
    posthog.capture('create new bounty_sponsor');
    router.push('/earn/dashboard/new?type=bounty');
  };

  const handleCreateProject = () => {
    posthog.capture('create new project_sponsor');
    router.push('/earn/dashboard/new?type=project');
  };

  const handleCreateHackathon = (hackathon: string) => {
    posthog.capture('create new hackathon_sponsor');
    router.push(`/earn/dashboard/new?type=hackathon&hackathon=${hackathon}`);
  };

  const visibleHackathons = getVisibleHackathons(hackathons);

  const isMD = useMediaQuery('(min-width: 768px)');

  if (!isMD) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className="overflow-hidden rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] p-0 shadow-[6px_6px_0_#1d1815] sm:max-w-160"
      >
        <button className="sr-only" />
        <ScrollArea
          className="max-h-svh"
          viewportProps={{
            className: 'h-full *:h-full',
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              transform: 'translateY(-30px)',
              filter: 'blur(4px)',
            }}
            animate={{
              opacity: 1,
              transform: 'translateY(0)',
              filter: 'blur(0px)',
            }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#1d1815] px-5 py-4">
                <h2 className="font-serif text-xl font-semibold text-[#1d1815]">
                  Select the type of listing
                </h2>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#6b5e50] hover:bg-[#f4eee3] hover:text-[#1d1815]"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
              <div className="grid grid-cols-2 gap-4 p-5">
                <Button
                  className="flex h-55 flex-col gap-4 rounded-none border-2 border-[#1d1815] bg-[#f4eee3] whitespace-normal text-[#6b5e50] shadow-[4px_4px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#f4eee3] hover:text-[#6b5e50] hover:shadow-[6px_6px_0_#1d1815]"
                  variant="outline"
                  onClick={handleCreateBounty}
                >
                  <BountyIcon
                    className="fill-[#ce4a2b]"
                    styles={{
                      width: '3rem',
                      height: '3rem',
                    }}
                  />
                  <span className="flex max-w-11/12 flex-col gap-1">
                    <h3 className="font-serif text-base font-semibold text-[#1d1815]">
                      Bounty
                    </h3>
                    <p className="text-sm font-normal text-[#6b5e50]">
                      Get multiple submissions for your task and reward the best
                      work
                    </p>
                  </span>
                </Button>
                <Button
                  className="flex h-55 flex-col gap-4 rounded-none border-2 border-[#1d1815] bg-[#f4eee3] whitespace-normal text-[#6b5e50] shadow-[4px_4px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#f4eee3] hover:text-[#6b5e50] hover:shadow-[6px_6px_0_#1d1815]"
                  variant="outline"
                  onClick={handleCreateProject}
                >
                  <ProjectIcon
                    className="fill-[#123a33]"
                    styles={{
                      width: '3rem',
                      height: '3rem',
                    }}
                  />
                  <span className="flex max-w-11/12 flex-col gap-1">
                    <h3 className="font-serif text-base font-semibold text-[#1d1815]">
                      Project
                    </h3>
                    <p className="text-sm font-normal text-[#6b5e50]">
                      Receive proposals for your work and pick the right
                      candidate
                    </p>
                  </span>
                </Button>
                {visibleHackathons.map((hackathon) => (
                  <Button
                    key={hackathon.id}
                    className="col-span-2 flex h-55 flex-col gap-4 rounded-none border-2 border-[#1d1815] bg-[#f4eee3] whitespace-normal text-[#6b5e50] shadow-[4px_4px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#f4eee3] hover:text-[#6b5e50] hover:shadow-[6px_6px_0_#1d1815]"
                    variant="outline"
                    onClick={() => {
                      handleCreateHackathon(hackathon.slug);
                    }}
                  >
                    {getListingIcon('hackathon', 'size-12 fill-[#1d1815]')}
                    <span className="flex max-w-6/12 flex-col gap-1">
                      <h3 className="font-serif text-base font-semibold text-[#1d1815]">
                        {hackathon.name} Track
                      </h3>
                      <p className="text-sm font-normal text-[#6b5e50]">
                        Get developers participating in {hackathon.name} to
                        build on top of your project
                      </p>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
