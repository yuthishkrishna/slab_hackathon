const { URL } = require('url');

function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique(items) {
    return [...new Map(items.filter(Boolean).map(item => [item.url || `${item.source}-${item.title}`, item])).values()];
}

function searchWords(query) {
    if (/\ball\b|latest|current|running|movies?\s+in\s+india/i.test(query)) return [];
    return query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(term => term.length > 2);
}

async function navigate(page, url, timeout = 15000) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        return true;
    } catch (error) {
        console.warn(`[Platform] Could not open ${url}: ${error.message}`);
        return false;
    }
}

async function chooseSelector(page, adapter, key, candidates) {
    const cached = adapter.getSelector(key);
    const choices = cached ? [cached, ...candidates.filter(candidate => candidate !== cached)] : candidates;
    for (const selector of choices) {
        try {
            if (await page.locator(selector).first().count()) {
                adapter.rememberSelector(key, selector);
                return selector;
            }
        } catch {
            // Try the next candidate after a DOM update.
        }
    }
    return null;
}

async function extractLinks(page, source, query, kind) {
    const anchors = await page.locator('a[href]').evaluateAll(elements => elements.map(element => ({
        text: element.innerText?.replace(/\s+/g, ' ').trim(),
        url: element.href,
        context: element.parentElement?.innerText?.replace(/\s+/g, ' ').trim()
    })).filter(item => item.text && item.url && !item.url.startsWith('javascript:')).slice(0, 250));
    const terms = searchWords(query);
    const results = anchors.filter(item => {
        const text = `${item.text} ${item.context || ''}`.toLowerCase();
        const title = item.text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
        if (kind === 'tickets' && terms.length) return terms.every(term => title.includes(term));
        return terms.length === 0 || terms.some(term => text.includes(term));
    }).slice(0, 8).map(item => {
        const context = item.context || item.text;
        const fare = context.match(/(?:₹|rs\.?|inr)\s?[\d,]+/i)?.[0] || context.match(/\b\d{2,5}\b/)?.[0] || 'Check platform';
        const time = context.match(/\b\d{1,2}:\d{2}\s?(?:am|pm)?\b/i)?.[0] || 'Check platform';
        const base = { source, title: normalize(item.text), url: item.url };
        if (kind === 'jobs') {
            return { ...base, operator: normalize(context.split(/\n| {2,}/)[0]) || source, location: 'See listing', compensation: fare };
        }
        if (kind === 'academic') {
            return { ...base, authors: normalize(context.split(/\n| {2,}/)[0]) || 'See paper', publicationDate: 'See paper', summary: normalize(context).slice(0, 180) };
        }
        return { ...base, operator: normalize(context.split(/\n|\|| {2,}/)[0]).slice(0, 80) || source, departure: time, fare, seats: 'Check availability' };
    });
    return unique(results);
}

async function searchPlatform(page, adapter, config, query) {
    const searchUrl = typeof config.searchUrl === 'function' ? config.searchUrl(query) : config.searchUrl;
    const opened = await navigate(page, searchUrl);
    if (!opened) return { source: config.name, status: 'unavailable', results: [], message: 'Platform could not be opened.' };

    const inputSelector = await chooseSelector(page, adapter, `${config.name}.searchInput`, config.searchInputs || []);
    if (inputSelector && config.searchUrl === config.homeUrl) {
        try {
            await page.locator(inputSelector).first().fill(query);
            await page.locator(inputSelector).first().press('Enter');
            await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
        } catch (error) {
            console.warn(`[${config.name}] Search interaction changed: ${error.message}`);
        }
    }

    const results = await extractLinks(page, config.name, query, config.kind);
    if (results.length) {
        adapter.rememberSelector(`${config.name}.resultLinks`, 'a[href]');
        return { source: config.name, status: 'ok', results };
    }

    adapter.markRescout(`${config.name}.resultLinks`, ['a[href]']);
    return { source: config.name, status: 'no-results', results: [], message: 'No matching public listings found.' };
}

function makeSearchUrl(base, query) {
    const url = new URL(base);
    const key = url.searchParams.has('q') ? 'q' : 'query';
    url.searchParams.set(key, query);
    return url.toString();
}

module.exports = { makeSearchUrl, navigate, searchPlatform, unique };
