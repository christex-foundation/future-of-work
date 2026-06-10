import BountyCard, { type Bounty } from '../cards/BountyCard';

const BOUNTIES: Bounty[] = [
  {
    logo: 'OR',
    org: 'Orange SL',
    location: 'Freetown',
    title: 'USSD menu for rural airtime top-ups',
    type: 'Bounty',
    tags: ['USSD', 'SMS Gateway'],
    daysLeft: 5,
    submitted: 14,
    currency: 'SLE',
    prize: '18,000',
  },
  {
    logo: 'CF',
    org: 'Christex',
    location: 'Remote',
    title: 'Brand identity for a fintech wallet',
    type: 'Design',
    tags: ['Branding', 'Figma'],
    daysLeft: 9,
    submitted: 7,
    currency: 'SLE',
    prize: '12,500',
  },
  {
    logo: 'ES',
    org: 'EduSalone',
    location: 'Bo',
    title: 'Build a React quiz app for students',
    type: 'Frontend',
    tags: ['React', 'TypeScript'],
    daysLeft: 12,
    submitted: 21,
    currency: 'SLE',
    prize: '30,000',
  },
  {
    logo: 'AG',
    org: 'AgriConnect',
    location: 'Makeni',
    title: 'Smart contract for crop payouts',
    type: 'Contract',
    tags: ['Solana', 'Rust'],
    daysLeft: 8,
    submitted: 5,
    currency: 'SLE',
    prize: '40,000',
  },
  {
    logo: 'FC',
    org: 'Freetown City',
    location: 'Freetown',
    title: 'Civic data dashboard for open budgets',
    type: 'Data',
    tags: ['Dashboards', 'Charts'],
    daysLeft: 6,
    submitted: 9,
    currency: 'SLE',
    prize: '22,000',
  },
  {
    logo: 'SH',
    org: 'SaloneHealth',
    location: 'Remote',
    title: 'Copy for a maternal-health campaign',
    type: 'Writing',
    tags: ['Copy', 'Krio'],
    daysLeft: 4,
    submitted: 18,
    currency: 'SLE',
    prize: '6,000',
  },
];

export default function FindWork() {
  return (
    <section
      aria-labelledby="find-work-heading"
      className="relative right-1/2 left-1/2 col-span-5 -mt-5 w-screen -translate-x-1/2 bg-[#6b5e50] px-6 py-20 md:py-28"
    >
      <div className="mb-12 text-center">
        <p className="font-secondary text-[11px] font-bold tracking-[0.26em] text-[#E6A12B] uppercase">
          Open opportunities
        </p>
        <h2
          id="find-work-heading"
          className="font-serif mt-3 text-[40px] leading-[1.05] font-semibold text-[#f4eee3] md:text-[52px]"
        >
          Find Work That Pays You
        </h2>
      </div>

      <div className="mx-auto grid max-w-[1120px] gap-5 px-2 sm:grid-cols-2 lg:grid-cols-3">
        {BOUNTIES.map((b) => (
          <BountyCard key={`${b.org}-${b.title}`} {...b} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <a
          href="/earn"
          target="_blank"
          rel="noopener noreferrer"
          className="font-secondary inline-flex items-center gap-2 rounded-xl bg-[#ce4a2b] px-6 py-3 text-[14px] font-bold tracking-[0.04em] text-[#f4eee3] uppercase shadow-[4px_4px_0_#1d1815] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1d1815]"
        >
          Browse all work &rarr;
        </a>
      </div>
    </section>
  );
}
