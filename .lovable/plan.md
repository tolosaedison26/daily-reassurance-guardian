

## Plan: Align Senior Dashboard with Caregiver Dashboard

### Key Differences Identified

Caregiver Dashboard uses `max-w-3xl mx-auto` container, consistent `p-4`/`p-5` card padding, standard button heights (`h-9` to `h-14`), and `w-14 h-14` avatars. Senior Dashboard lacks a max-width container, uses oversized elements (check-in button `h-20 text-2xl`, mic button `w-20 h-20`, status card emoji `text-5xl`), and has inconsistent spacing.

### Changes

**1. `src/pages/SeniorHome.tsx`**
- Wrap main content in `max-w-3xl mx-auto` container (matching caregiver)
- Reduce check-in button: `h-20 text-2xl` to `h-14 text-lg`
- Scale down status card emoji from `text-5xl` to `text-3xl`
- Reduce status card title from `text-xl` to `text-lg`
- Reduce greeting from `text-3xl` to match caregiver's `text-3xl` (already matches -- keep)
- Reduce Emergency 911 icon container from `w-12 h-12` to `w-11 h-11` and Calm Sounds icon similarly
- Adjust top bar padding to `pt-10 pb-4` (matching caregiver's `pt-10 pb-4`)
- Tighten vertical gap in main content area from `gap-6` to `gap-4`
- Add bottom padding `pb-10` for scroll clearance

**2. `src/components/VoiceRecorder.tsx`**
- Reduce mic button from `w-20 h-20` to `w-14 h-14`
- Reduce mic/square icons from `w-8 h-8` to `w-6 h-6`
- Reduce card padding from `p-5` to `p-4`

**3. `src/components/InviteCodeCard.tsx`**
- Reduce code display text from `text-3xl` to `text-2xl`
- Reduce card padding from `p-5` to `p-4`

**4. `src/components/EmergencyContacts.tsx`**
- No changes needed -- already uses consistent sizing

All changes are CSS/className adjustments only. No logic or data changes.

