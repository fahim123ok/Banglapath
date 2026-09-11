/* Browser-side configuration.
 *
 * The key never lives in here. server.js proxies POST /api/chat and injects
 * GEMINI_API_KEY from the environment, so the browser only ever talks to your
 * own origin.
 *
 * If you want to open index.html straight off disk with no server, drop a
 * config.local.js next to this file (it is git-ignored) containing:
 *   window.BANGLAPATH_CONFIG.geminiApiKey = 'your-key';
 */
window.BANGLAPATH_CONFIG = {
  proxyUrl: '/api/chat',
  model: 'gemini-2.5-flash',
  geminiApiKey: '',
};
