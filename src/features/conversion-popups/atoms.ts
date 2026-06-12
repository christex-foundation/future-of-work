import { atom } from 'jotai';

import { type TimeoutHandle } from '@/hooks/use-timeout';

// Master switch for the auto-opening conversion/login popups shown to
// signed-out visitors. Disabled for now so the app can be browsed without
// being nagged to log in. Flip to true to restore (still production-only).
export const CONVERSION_POPUPS_ENABLED = false;

const popupsShowedAtom = atom(0);
const popupOpenAtom = atom(false);

const popupTimeoutAtom = atom<TimeoutHandle>();

export { popupOpenAtom, popupsShowedAtom, popupTimeoutAtom };
