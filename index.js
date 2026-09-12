const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const runAcademicAgent = require('./agents/academicAgent');
const runTicketAgent = require('./agents/ticketAgent');
const runJobAgent = require('./agents/jobAgent');

async function masterRouter(prompt, options = {}) {
    console.log(`[Master Router] Analyzing prompt: "${prompt}"`);
    
    const normalizedPrompt = prompt.toLowerCase();
    let intent = 'unknown';
    if (normalizedPrompt.includes('paper') || normalizedPrompt.includes('research')) {
        intent = 'academic';
    } else if (normalizedPrompt.includes('ticket') || normalizedPrompt.includes('movie')) {
        intent = 'tickets';
    } else if (normalizedPrompt.includes('job') || normalizedPrompt.includes('hire')) {
        intent = 'jobs';
    }

    if (intent === 'unknown') {
        return { intent, data: null, message: "Try a research, ticket, or job request." };
    }

    let browser;
    try {
        browser = await chromium.launch({ headless: options.headless !== false });
    } catch (error) {
        if (error.message.includes('Executable doesn\'t exist')) {
            throw new Error('Playwright browser is missing. Run "npx playwright install chromium" and retry.');
        }
        throw error;
    }
    const context = await browser.newContext();

    try {
        let data;
        switch (intent) {
            case 'academic':
                data = await runAcademicAgent(context, extractQuery(prompt, /research|paper/i, 'AI agents'), options);
                break;
            case 'tickets':
                data = await runTicketAgent(context, parseTicketRequest(prompt), options);
                break;
            case 'jobs':
                data = await runJobAgent(context, extractQuery(prompt, /job as|jobs for|job|hire/i, 'software engineer'), options);
                break;
        }
        return { intent, data };
    } catch (error) {
        console.error("Agent failed:", error);
        throw error;
    } finally {
        await browser.close();
    }
}

function parseTicketRequest(prompt) {
    const cleanedPrompt = prompt.replace(/^\s*(?:find|search|book|get me)\s+/i, '').trim();
    const nearMatch = cleanedPrompt.match(/\bnear\s+(.+)$/i);
    const theatreMatch = cleanedPrompt.match(/\b(?:at|in)\s+(.+)$/i);
    const withoutPreference = cleanedPrompt.replace(/\s+(?:near|at|in)\s+.+$/i, '').trim();
    const directMatch = withoutPreference.match(/(?:tickets?|movie|show)\s+(?:for|to)\s+(.+)$/i);
    const titleFirstMatch = withoutPreference.match(/^(.+?)\s+(?:tickets?|movie|show)$/i);
    return {
        eventName: (directMatch?.[1] || titleFirstMatch?.[1] || 'Spider-Man').trim(),
        theatre: theatreMatch?.[1]?.trim() || '',
        location: nearMatch?.[1]?.trim() || ''
    };
}

function extractQuery(prompt, marker, fallback) {
    return prompt.replace(new RegExp(`.*?${marker.source}`, 'i'), '').trim() || fallback;
}

function serveStaticFile(response, fileName) {
    const safeName = fileName === '/' ? 'index.html' : fileName.replace(/^\/+/, '');
    const filePath = path.join(__dirname, safeName);
    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }
    const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'text/plain' });
    response.end(fs.readFileSync(filePath));
}

function startServer(port = process.env.PORT || 3000) {
    const server = http.createServer((request, response) => {
        if (request.method === 'POST' && request.url === '/api/run') {
            let body = '';
            request.on('data', chunk => { body += chunk; });
            request.on('end', async () => {
                try {
                    const parsedBody = JSON.parse(body || '{}');
                    const { prompt } = parsedBody;
                    if (!prompt?.trim()) throw new Error('Enter a request first.');
                    const result = await masterRouter(prompt.trim());
                    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    response.end(JSON.stringify(result));
                } catch (error) {
                    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    response.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }
        serveStaticFile(response, request.url.split('?')[0]);
    });
    server.listen(port, () => console.log(`SLAB dashboard running at http://localhost:${port}`));
    return server;
}

if (require.main === module) {
    if (process.argv[2]) {
        masterRouter(process.argv.slice(2).join(' '), { headless: false, requireApproval: true })
            .catch(() => process.exitCode = 1);
    } else {
        startServer();
    }
}

module.exports = { masterRouter, startServer };