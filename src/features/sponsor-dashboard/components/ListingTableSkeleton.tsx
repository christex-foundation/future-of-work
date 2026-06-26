import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

const thClassName =
  'text-sm font-medium capitalize tracking-tight text-[#6b5e50]';

export const ListingTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <>
      <div className="mb-2 flex gap-4 pt-4">
        <Skeleton className="ml-2 h-4 w-8 bg-[#E9E0CD]" />
        <Skeleton className="h-4 w-16 bg-[#E9E0CD]" />
        <Skeleton className="h-4 w-16 bg-[#E9E0CD]" />
      </div>
      <div className="mb-2 h-0.5 w-full bg-[#e6dcc9]" />

      <div className="mt-0 w-full overflow-x-auto rounded-md border-2 border-[#1d1815]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F2EAD9]">
              <TableHead className={thClassName} />
              <TableHead className={thClassName}>Listing Name</TableHead>
              <TableHead className={cn(thClassName, 'text-center')}>
                Submissions
              </TableHead>
              <TableHead className={thClassName}>Deadline</TableHead>
              <TableHead className={thClassName}>Prize</TableHead>
              <TableHead className={thClassName}>Status</TableHead>
              <TableHead className={cn(thClassName, 'pl-6')}>Actions</TableHead>
              <TableHead className="pl-0" />
              <TableHead className="pl-0" />
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="py-4 pr-0">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-[#E9E0CD]" />
                </TableCell>
                <TableCell className="max-w-80 py-4">
                  <Skeleton className="h-4 w-48 bg-[#E9E0CD]" />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-6 bg-[#E9E0CD]" />
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-24 bg-[#E9E0CD]" />
                </TableCell>
                <TableCell className="py-4 pr-6">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-5 w-5 rounded-full bg-[#E9E0CD]" />
                    <Skeleton className="h-4 w-16 bg-[#E9E0CD]" />
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-16 rounded-full bg-[#E9E0CD]" />
                </TableCell>
                <TableCell className="px-0 py-4">
                  <Skeleton className="h-5 w-20 rounded-md bg-[#E9E0CD]" />
                </TableCell>
                <TableCell className="px-0 py-4">
                  <Skeleton className="h-5 w-2 rounded-md bg-[#E9E0CD]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
