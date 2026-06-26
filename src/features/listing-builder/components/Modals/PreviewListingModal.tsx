import { useAtom } from 'jotai';
import { ExternalLink, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import { useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { previewAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

export const PreviewListingModal = () => {
  const [showPreview, setShowPreview] = useAtom(previewAtom);
  const [activeView, setActiveView] = useState('desktop');
  const [isLoading, setIsLoading] = useState(true);

  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const slug = useWatch({
    control: form.control,
    name: 'slug',
  });
  const previewUrl = useMemo(() => {
    return `/earn/listing/${slug}?preview=1`;
  }, [type, slug]);

  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent
        hideCloseIcon
        className="h-full max-w-full bg-[#FBF7EF] p-0 text-[#221A14]"
      >
        <DialogHeader className="border-b border-[#E6DCC9] bg-[#FFF9EF] px-8 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <DialogTitle className="font-serif text-xl font-semibold text-[#221A14]">
              Preview Listing
            </DialogTitle>

            <Tabs
              value={activeView}
              onValueChange={setActiveView}
              className="justify-self-center"
            >
              <TabsList className="border border-[#E6DCC9] bg-[#F2EAD9]">
                <TabsTrigger
                  className="text-sm data-[state=active]:bg-[#2C3A2E] data-[state=active]:text-white"
                  value="desktop"
                >
                  Desktop
                </TabsTrigger>
                <TabsTrigger
                  className="text-sm data-[state=active]:bg-[#2C3A2E] data-[state=active]:text-white"
                  value="mobile"
                >
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="ph-no-capture border-[#D9CCB2] bg-[#FFFDF8] text-[#2C3A2E] hover:bg-[#F2EAD9]"
                  onClick={() => {
                    posthog.capture('new tab_preview');
                    window.open(previewUrl, '_blank');
                  }}
                >
                  <span>Secret Draft Link</span>
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Button
                className="ph-no-capture bg-[#2C3A2E] text-white hover:bg-[#3C4D3D]"
                onClick={() => {
                  posthog.capture('continue editing_preview');
                  setShowPreview(false);
                }}
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="h-full p-10">
          <div
            className="relative mx-auto h-[900px] w-4/5 overflow-hidden rounded-lg border border-[#E6DCC9] bg-[#FFFDF8] shadow-[0_22px_60px_rgba(44,58,46,0.12)]"
            style={{
              width: activeView === 'mobile' ? '420px' : '100%',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FFFDF8]/80">
                <Loader2 className="h-8 w-8 animate-spin text-[#2C3A2E]" />
              </div>
            )}
            <iframe
              src={`${previewUrl}&nsb=1`}
              className="h-full w-full"
              title="Preview"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
