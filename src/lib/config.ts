/**
 * Link for voluntary donations (Vipps / PayPal page on our website).
 * Page source: web/varde/index.html (unlisted, noindex). Leave empty to hide the "Support Varde Fitness" button. Donations never unlock anything in the app
 * (App Store / Google Play rules for gifts outside in-app purchase).
 */
export const SUPPORT_URL = 'https://cieas.no/varde/';

/** Brand shown as a quiet "Powered by" line in Settings → About (not an ad: no banners, no tracking). */
export const POWERED_BY = { name: 'Norgain', url: 'https://norgain.no' };

/**
 * Optional account + backup (Supabase project "varde-fitness", eu-central-1).
 * The publishable key is meant to ship in the app: every row is protected by row-level security
 * (a signed-in user can only read and write their own backup).
 */
export const SUPABASE_URL = 'https://bcfhjofvcnzljpcoooab.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_ztqnwVfxLxyE8vgMi0f4jg_wHpWI6LF';
