/**
 * Daybreak listing-status pills.
 * Mirrors the narrow palette used by the submission status pills
 * (see sponsor-dashboard/utils/statusColorMap): statuses are grouped into
 * semantic families rather than each keeping a unique hue.
 *   forest #123a33 -> live / published / completed (success)
 *   terra  #ce4a2b -> failed / unpublished (negative)
 *   gold   #e6a12b -> needs attention / in review / pending (warning)
 *   sage   #8FA37E -> in progress (positive-neutral)
 *   muted  #6b5e50 -> draft (de-emphasised)
 */
const forest = {
  bgColor: 'bg-[#123a33]/12',
  color: 'text-[#123a33]',
  borderColor: 'border-[#123a33]/25',
  focus: 'focus:bg-[#123a33]/20 focus:text-[#123a33]',
};
const terra = {
  bgColor: 'bg-[#ce4a2b]/12',
  color: 'text-[#ce4a2b]',
  borderColor: 'border-[#ce4a2b]/30',
  focus: 'focus:bg-[#ce4a2b]/20 focus:text-[#ce4a2b]',
};
const gold = {
  bgColor: 'bg-[#e6a12b]/20',
  color: 'text-[#1d1815]',
  borderColor: 'border-[#e6a12b]/50',
  focus: 'focus:bg-[#e6a12b]/30 focus:text-[#1d1815]',
};
const sage = {
  bgColor: 'bg-[#8FA37E]/22',
  color: 'text-[#3C4D3D]',
  borderColor: 'border-[#8FA37E]/55',
  focus: 'focus:bg-[#8FA37E]/32 focus:text-[#3C4D3D]',
};
const muted = {
  bgColor: 'bg-[#1d1815]/6',
  color: 'text-[#6b5e50]',
  borderColor: 'border-[#1d1815]/20',
  focus: 'focus:bg-[#1d1815]/12 focus:text-[#6b5e50]',
};

export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return forest;
    case 'Under Verification':
    case 'Fndn to Pay':
    case 'Payment Pending':
      return gold;
    case 'Verification Failed':
      return terra;
    case 'Draft':
      return muted;
    case 'In Review':
      return gold;
    case 'In Progress':
      return sage;
    case 'Unpublished':
      return terra;
    default:
      return {
        bgColor: 'bg-[#1d1815]/8',
        color: 'text-[#1d1815]',
        borderColor: 'border-[#1d1815]/25',
        focus: 'focus:bg-[#1d1815]/15 focus:text-[#1d1815]',
      };
  }
};
