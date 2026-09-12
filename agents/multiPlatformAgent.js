const WebcmdAdapter = require('../utils/webcmdAdapter');
const { searchPlatform, unique } = require('../utils/platformSearch');

async function runAcrossPlatforms(context, platforms, query, memoryFile, options = {}) {
    const adapter = new WebcmdAdapter(memoryFile.replace('.json', ''), memoryFile);
    const results = await Promise.allSettled(platforms.map(async platform => {
        const page = await context.newPage();
        try {
            return await searchPlatform(page, adapter, platform, query);
        } finally {
            await page.close().catch(() => {});
        }
    }));
    const sources = results.map((result, index) => result.status === 'fulfilled'
        ? result.value
        : { source: platforms[index].name, status: 'error', results: [], message: result.reason?.message || 'Platform search failed.' });
    const data = unique(sources.flatMap(source => source.results)).slice(0, options.limit || 24);
    return { query, data, sources, searchedAt: new Date().toISOString() };
}

module.exports = { runAcrossPlatforms };
