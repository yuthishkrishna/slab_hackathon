const { academicPlatforms } = require('../utils/platformCatalog');
const { runAcrossPlatforms } = require('./multiPlatformAgent');

async function runAcademicAgent(context, query, options = {}) {
    const topic = typeof query === 'string' ? query.trim() : 'AI agents';
    console.log(`\n--- Searching academic platforms for: "${topic}" ---`);
    const result = await runAcrossPlatforms(context, academicPlatforms, topic, 'academic_adapter.json', { limit: options.limit || 24 });
    return { ...result, type: 'academic-search', safety: 'Read-only research search.' };
}

module.exports = runAcademicAgent;
