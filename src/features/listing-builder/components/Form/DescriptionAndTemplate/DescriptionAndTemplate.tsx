import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { MinimalTiptapEditor } from '@/components/tiptap';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  descriptionKeyAtom,
  isEditingAtom,
  submitListingMutationAtom,
} from '@/features/listing-builder/atoms';

import { useListingForm } from '../../../hooks';
import { BriefExample } from './BriefExample';
import { Templates } from './Templates';

import styles from '@/styles/listing-description.module.css';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const router = useRouter();
  const isEditing = useAtomValue(isEditingAtom);
  const submitMutation = useAtomValue(submitListingMutationAtom);
  const templateId = useWatch({
    control: form.control,
    name: 'templateId',
  });
  const [descriptionKey, setDescriptionKey] = useAtom(descriptionKeyAtom);

  const originalDescriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const currentDescription = form.getValues('description');
    if (originalDescriptionRef.current === null) {
      originalDescriptionRef.current = currentDescription || '';
      console.log('Saved original description for image cleanup');
    }
  }, [form]);

  useEffect(() => {
    setDescriptionKey(`editor-${templateId || 'default'}`);
  }, [templateId, setDescriptionKey]);

  useEffect(() => {
    const processCleanup = () => {
      if (
        submitMutation.isPending ||
        submitMutation.isSuccess ||
        submitMutation.isError
      ) {
        console.log('Skipping cleanup - submit mutation is active/completed');
        return;
      }

      if (typeof window !== 'undefined') {
        if (isEditing && window.__processOrphanedImageCleanup) {
          console.log('Processing orphaned image cleanup (edit mode)');
          try {
            window.__processOrphanedImageCleanup(
              originalDescriptionRef.current || '',
            );
          } catch (error) {
            console.error('Failed to process orphaned image cleanup:', error);
          }
        } else if (!isEditing && window.__processImageCleanup) {
          console.log('Processing image cleanup (draft mode)');
          try {
            window.__processImageCleanup();
          } catch (error) {
            console.error('Failed to process image cleanup:', error);
          }
        }
      }
    };

    const handleRouteStart = () => {
      processCleanup();
    };

    const handleBeforeUnload = () => {
      processCleanup();
    };

    router.events.on('routeChangeStart', handleRouteStart);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    router.events,
    isEditing,
    submitMutation.isPending,
    submitMutation.isSuccess,
    submitMutation.isError,
  ]);

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div className="flex items-center justify-between">
              <FormLabel isRequired className="text-[#5C5147]">
                Description
              </FormLabel>
              <div className="flex items-center gap-2">
                <BriefExample />
                <Templates />
              </div>
            </div>
            <p className="-mt-1 text-xs text-[#5C5147]">
              A strong brief covers three sections:{' '}
              <span className="font-semibold text-[#3A322A]">Overview</span> (the
              full task and context),{' '}
              <span className="font-semibold text-[#3A322A]">Requirements</span>{' '}
              (what a valid submission must include), and{' '}
              <span className="font-semibold text-[#3A322A]">
                Judging Criteria
              </span>{' '}
              (how entries are scored).
            </p>
            <div className="flex rounded-md border border-[#E6DCC9] bg-[#FFFDF8] has-focus:ring-1 has-focus:ring-[#2C3A2E]">
              <FormControl>
                <MinimalTiptapEditor
                  key={descriptionKey}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="min-h-[66vh] w-full border-0 bg-[#FFFDF8]"
                  editorContentClassName={`${styles.content} mt-4 mb-4 px-4 h-full [&>*:first-child>*:first-child]:mt-0!`}
                  output="html"
                  placeholder="Type your description here..."
                  editable={true}
                  editorClassName="focus:outline-hidden"
                  imageSetting={{
                    source: 'description',
                  }}
                  toolbarClassName="sticky top-18 bg-[#FFF9EF] z-10 border-b border-[#E6DCC9]"
                />
              </FormControl>
            </div>
            <FormMessage className="ml-auto w-fit" />
          </FormItem>
        );
      }}
    />
  );
}
