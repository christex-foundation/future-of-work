/**
 * Daybreak status pills.
 * The palette is intentionally narrow, so statuses are grouped into semantic
 * families rather than each keeping a unique hue:
 *   forest #123a33  -> success / approved / done-well
 *   terra  #ce4a2b  -> rejected / spam / inaccessible (negative)
 *   gold   #e6a12b  -> pending / needs-review / unreviewed (warning)
 *   sage   #8FA37E  -> shortlisted / mid-quality (positive-neutral)
 *   ink    #1d1815  -> reviewed / completed (neutral info)
 *   muted  #6b5e50  -> low-quality (de-emphasised)
 * Light tints keep the pills legible on the cream (#f4eee3) dashboard surface.
 */
const forest = {
  bg: 'bg-[#123a33]/12',
  color: 'text-[#123a33]',
  border: 'border-[#123a33]/25',
  focus: 'focus:text-[#123a33] focus:bg-[#123a33]/20',
};
const terra = {
  bg: 'bg-[#ce4a2b]/12',
  color: 'text-[#ce4a2b]',
  border: 'border-[#ce4a2b]/30',
  focus: 'focus:text-[#ce4a2b] focus:bg-[#ce4a2b]/20',
};
const gold = {
  bg: 'bg-[#e6a12b]/20',
  color: 'text-[#1d1815]',
  border: 'border-[#e6a12b]/50',
  focus: 'focus:text-[#1d1815] focus:bg-[#e6a12b]/30',
};
const sage = {
  bg: 'bg-[#8FA37E]/22',
  color: 'text-[#3C4D3D]',
  border: 'border-[#8FA37E]/55',
  focus: 'focus:text-[#3C4D3D] focus:bg-[#8FA37E]/32',
};
const ink = {
  bg: 'bg-[#1d1815]/8',
  color: 'text-[#1d1815]',
  border: 'border-[#1d1815]/25',
  focus: 'focus:text-[#1d1815] focus:bg-[#1d1815]/15',
};
const muted = {
  bg: 'bg-[#1d1815]/6',
  color: 'text-[#6b5e50]',
  border: 'border-[#1d1815]/20',
  focus: 'focus:text-[#6b5e50] focus:bg-[#1d1815]/12',
};

export const colorMap = {
  Needs_Review: gold,
  Inaccessible: terra,
  Low_Quality: muted,
  Mid_Quality: sage,
  High_Quality: forest,
  Spam: terra,
  Reviewed: ink,
  Unreviewed: gold,
  Shortlisted: sage,
  Approved: forest,
  Rejected: terra,
  Pending: gold,
  Winner: forest,
  Completed: ink,
  Paid: forest,
};
