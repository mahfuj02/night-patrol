import type { CommunityNote } from './schema';

// TODO(content): owner to review this wording. Keep it short and respectful.
export const communityNotes: CommunityNote[] = [
  {
    id: 'warming-shelter',
    title: 'Warming shelter',
    body: 'Winter nights in Winnipeg can drop to -30°C, and some people are outside in them. These organizations help.',
    links: [
      { label: 'Siloam Mission', href: 'https://www.siloam.ca/' },
      { label: 'Main Street Project', href: 'https://www.mainstreetproject.ca/' },
      {
        label: 'Harvest Manitoba (formerly Winnipeg Harvest)',
        href: 'https://www.harvestmanitoba.ca/',
      },
    ],
  },
];
