const { requireHumanApproval } = require('../utils/safety');
const { ticketPlatforms } = require('../utils/platformCatalog');
const { runAcrossPlatforms } = require('./multiPlatformAgent');

async function runTicketAgent(context, request, options = {}) {
    const normalized = typeof request === 'string' ? { eventName: request } : request;
    const eventName = normalized.eventName || 'latest movies';
    const location = normalized.location || '';
    const theatre = normalized.theatre || '';
    const searchQuery = [eventName, location, theatre].filter(Boolean).join(' ');
    console.log(`\n--- Searching ticket platforms for: "${searchQuery}" ---`);
    const result = await runAcrossPlatforms(context, ticketPlatforms, searchQuery, 'ticket_adapter.json', { limit: 24 });
    const rankedResults = result.data
        .map(item => ({ ...item, relevance: scoreListing(item, { location, theatre }) }))
        .sort((left, right) => right.relevance - left.relevance);
    if (options.stageBooking === true && result.data.length) {
        requireHumanApproval(`stage a booking link for "${eventName}"`);
    }
    return {
        ...result,
        data: rankedResults,
        query: searchQuery,
        preferences: { location, theatre },
        type: 'ticket-search',
        safety: 'Search only. No checkout, payment, or seat mutation was performed.'
    };
}

function scoreListing(item, preferences) {
    const haystack = `${item.title || ''} ${item.operator || ''} ${item.context || ''}`.toLowerCase();
    let score = 0;
    if (preferences.location && haystack.includes(preferences.location.toLowerCase())) score += 3;
    if (preferences.theatre && haystack.includes(preferences.theatre.toLowerCase())) score += 5;
    if (item.source === 'BookMyShow') score += 2;
    if (item.url) score += 1;
    return score;
}

module.exports = runTicketAgent;
