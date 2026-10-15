// the snappy pod's own dev server: no HMR (other agents' edits must not reload a page mid-measurement)
import base from '../vite.config.js';
export default { ...base, server: { ...(base.server || {}), hmr: false, watch: { ignored: ['**/*'] } } };
