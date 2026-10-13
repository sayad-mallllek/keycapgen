// Use a self-hosted copy of a maker photo when one has been downloaded (npm run photos),
// otherwise load it from the maker's site.
import manifest from '../../public/photos/manifest.json' with { type: 'json' };
export const local = u => (manifest[u] ? '/photos/' + manifest[u] : u);
