import OpportunityCard, { type Opportunity } from '../cards/OpportunityCard';

const OPPORTUNITIES: Opportunity[] = [
  {
    title: 'Bounties',
    icon: 'bounties',
    accent: '#E6A12B',
    cue: 'Compete & win',
    clearance: 'OPEN-BOUNTY',
    description:
      'Open challenges with a set prize. Anyone can submit their work, and the best entries get paid — you compete on quality, not connections.',
  },
  {
    title: 'Quests',
    icon: 'quests',
    accent: '#CE4A2B',
    cue: 'Learn & earn',
    clearance: 'GUIDED-QUEST',
    description:
      'Guided, step-by-step tasks that teach a real skill. Finish each step to learn by doing, and earn a reward when you complete the quest.',
  },
  {
    title: 'Projects',
    icon: 'projects',
    accent: '#E7D3C1',
    cue: 'Apply & build',
    clearance: 'CONTRACT-GIG',
    description:
      'Scoped gigs you apply for. Get selected, do the work, and get paid on delivery — like a freelance job with a clear budget and timeline.',
  },
];

export default function Production() {
  return (
    <div className="productions-container relative right-1/2 left-1/2 col-span-5 -mt-5 flex w-screen -translate-x-1/2 flex-col justify-center bg-[#ece2d2] px-6 py-20 md:py-28">
      <div className="relative z-10 text-center">
        <p className="font-secondary text-[11px] font-bold tracking-[0.26em] text-[#CE4A2B] uppercase">
          Get paid to build
        </p>
        <h2 className="font-serif mt-3 text-[40px] leading-[1.05] font-semibold text-[#1d1815] md:text-[52px]">
          Earning Opportunities
        </h2>
      </div>

      <div className="relative z-10 mx-auto mt-14 grid max-w-[1120px] gap-5 px-2 sm:grid-cols-2 lg:grid-cols-3">
        {OPPORTUNITIES.map((o) => (
          <OpportunityCard key={o.title} {...o} />
        ))}
      </div>
    </div>
  );
}
