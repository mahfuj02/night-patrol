import type { RadioLine } from './schema';

// Every radio line is shown as a caption; there is no audio in Phase 1.
// TODO(content): verify wording of lines that are not quoted in PROJECT_PLAN.
export const radioLines: RadioLine[] = [
  {
    id: 'dispatch',
    stopId: 'dispatch',
    text: 'Unit 02, Mahfuj, Full Stack Developer, starting patrol.',
  },
  {
    id: 'rrc-campus',
    stopId: 'rrc-campus',
    // TODO(content): owner to tweak the wording.
    text: 'Unit 02, Exchange District. RRC campus on your left. This is where my Winnipeg tech journey started.',
  },
  {
    id: 'exchange-warehouses',
    stopId: 'exchange-warehouses',
    // TODO(content): owner to tweak the wording.
    text: 'Show tonight at the old warehouse. Tickets running through EventFlow, on your left.',
  },
  {
    id: 'city-services',
    stopId: 'city-services',
    // TODO(content): owner to tweak the wording.
    text: 'City services building on your left. Every request logged, tracked and closed out. CivicTrack.',
  },
  {
    id: 'portage-main',
    stopId: 'portage-main',
    text: 'Dispatch, the wind at Portage and Main is doing its usual thing. Hold your hat.',
  },
  {
    id: 'warming-shelter',
    stopId: 'warming-shelter',
    text: 'Quiet block ahead. Warm lights on. Slow down.',
  },
  { id: 'shift-complete', stopId: 'the-forks', text: 'Shift complete.' },
];
