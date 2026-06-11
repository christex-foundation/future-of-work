import { zodResolver } from '@hookform/resolvers/zod';
import IsoDomPurify from 'isomorphic-dompurify';
import posthog from 'posthog-js';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/store/user';

const hardDomPurify = (dirty: string | Node, cfg?: IsoDomPurify.Config) =>
  IsoDomPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ...cfg,
  });

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.preprocess(
    (val) => hardDomPurify(val as unknown as string),
    z.string().min(1, { message: 'Subject is required' }),
  ),
  description: z.preprocess(
    (val) => hardDomPurify(val as unknown as string),
    z
      .string()
      .min(10, { message: 'Description must be at least 10 valid characters' }),
  ),
});

type FormData = z.infer<typeof formSchema>;

interface ModalFormProps {
  children: React.ReactNode;
  onSubmit?: (data: FormData) => void;
}

export function SupportFormDialog({ children, onSubmit }: ModalFormProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || '',
      subject: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (user?.email) {
      form.setValue('email', user.email);
    }
  }, [user, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      posthog.capture('submit_support form');
      const response = await fetch('/api/email/manual/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email || data.email,
          subject: hardDomPurify(data.subject),
          description: hardDomPurify(data.description),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || 'Failed to send message',
        );
      }

      toast.success('Message sent');

      onSubmit?.(data);

      setOpen(false);
      form.reset({
        email: user?.email || '',
        subject: '',
        description: '',
      });
    } catch (error) {
      console.error('Error sending support message:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        onClick={() => posthog.capture('open_support form')}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="gap-2 rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] px-0 shadow-[6px_6px_0_#1d1815] sm:max-w-xl">
        <DialogHeader className="border-b-2 border-dashed border-[#1d1815]/20 px-6 pb-4">
          <DialogTitle className="font-serif text-lg font-semibold text-[#1d1815]">
            Get In Touch With Us
          </DialogTitle>
          <DialogDescription className="font-primary text-sm text-[#6b5e50]">
            Describe what you need from us, and we&apos;ll get in touch with you
            as soon as possible
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 px-6 pt-4"
          >
            {!user && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-1" isRequired>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Your email"
                        className="rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] text-[#1d1815] placeholder:text-[#6b5e50]/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-1" isRequired>
                    Subject
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a short subject line"
                      className="rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] text-[#1d1815] placeholder:text-[#6b5e50]/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-1" isRequired>
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a short description on how we can help"
                      className="min-h-[150px] rounded-none border-2 border-[#1d1815] bg-[#FBF7EE] text-[#1d1815] placeholder:text-[#6b5e50]/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-none border-2 border-[#1d1815] bg-[#e6a12b] text-[#1d1815] shadow-[3px_3px_0_#1d1815] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e6a12b] hover:shadow-[1px_1px_0_#1d1815]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Continue →'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
