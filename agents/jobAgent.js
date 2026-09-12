const { jobPlatforms } = require('../utils/platformCatalog');
const { runAcrossPlatforms } = require('./multiPlatformAgent');

async function runJobAgent(context, role, options = {}) {
    const query = typeof role === 'string' ? role.trim() : 'software engineer';
    console.log(`\n--- Searching career platforms for: "${query}" ---`);
    const result = await runAcrossPlatforms(context, jobPlatforms, query, 'job_adapter.json', { limit: options.limit || 24 });
    return { ...result, type: 'job-search', safety: 'Listings only. Applications and outreach are never submitted automatically.' };
}

module.exports = runJobAgent;
