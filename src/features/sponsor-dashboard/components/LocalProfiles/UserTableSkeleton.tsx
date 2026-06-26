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

const thClassName = 'text-xs font-medium tracking-wider text-[#6b5e50]';

export const UserTableSkeleton = ({ rows = 10 }: { rows?: number }) => {
  return (
    <div className="rounded-xl border-2 border-[#1d1815] bg-[#FBF7EF] shadow-[5px_5px_0_#1d1815]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#e6dcc9] bg-[#F2EAD9]">
            <TableHead className={cn(thClassName, 'pr-2')}># Rank</TableHead>
            <TableHead className={thClassName}>User</TableHead>
            <TableHead className={cn(thClassName, 'px-1')}>$ Earned</TableHead>
            <TableHead className={cn(thClassName, 'px-0 text-center')}>
              Submissions
            </TableHead>
            <TableHead className={cn(thClassName, 'px-1 text-center')}>
              Wins
            </TableHead>
            <TableHead className={thClassName}>Skills</TableHead>
            <TableHead className={thClassName}>Socials</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="w-12 p-1">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-8 bg-[#E9E0CD]" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full bg-[#E9E0CD]" />
                  <div className="ml-2">
                    <Skeleton className="mb-1 h-4 w-28 bg-[#E9E0CD]" />
                    <Skeleton className="h-3 w-20 bg-[#E9E0CD]" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-1">
                <Skeleton className="h-4 w-16 bg-[#E9E0CD]" />
              </TableCell>
              <TableCell className="p-0">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-6 bg-[#E9E0CD]" />
                </div>
              </TableCell>
              <TableCell className="p-1">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-6 bg-[#E9E0CD]" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded bg-[#E9E0CD]" />
                  <Skeleton className="h-5 w-14 rounded bg-[#E9E0CD]" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-16 gap-4">
                  <Skeleton className="h-5 w-5 rounded bg-[#E9E0CD]" />
                  <Skeleton className="h-5 w-5 rounded bg-[#E9E0CD]" />
                  <Skeleton className="h-5 w-5 rounded bg-[#E9E0CD]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 bg-[#E9E0CD]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
