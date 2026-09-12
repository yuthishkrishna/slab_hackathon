const promptInput = document.getElementById('promptInput');
const runButton = document.getElementById('runBtn');
const outputConsole = document.getElementById('outputConsole');
const liveState = document.getElementById('liveState');

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

function isNoisyJobValue(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return !text || text.length > 90 || /skip to main content|sign in|join now|cookie policy|privacy policy|search options|show forgot password/i.test(text);
}

function requestedJobRole(prompt) {
    const match = String(prompt || '').match(/\bjobs?\s+(?:for\s+)?(.+)/i);
    return match && !isNoisyJobValue(match[1]) ? match[1].trim() : 'Job opportunity';
}

function renderResults(result, prompt) {
    const payload = result.data || {};
    const items = Array.isArray(payload) ? payload : (payload.data || []);
    const cards = items.filter(Boolean).map(item => {
        if (typeof item !== 'object') return `<p>${escapeHtml(item)}</p>`;
        const title = item.title || item.event || item.role || 'Untitled result';
        const sourceUrl = item.url || item.link;
        if (result.intent === 'tickets') {
            const theatre = item.operator || 'Theatre listed on source';
            const availability = item.seats && item.seats !== 'Check availability' ? item.seats : 'Check seats on source';
            const details = [
                `<span><b>Theatre:</b> ${escapeHtml(theatre)}</span>`,
                `<span><b>Showtime:</b> ${escapeHtml(item.departure || 'Check source')}</span>`,
                `<span><b>Seats:</b> ${escapeHtml(availability)}</span>`,
                item.fare && item.fare !== 'Check platform' ? `<span><b>Price:</b> ${escapeHtml(item.fare)}</span>` : ''
            ].join('');
            const link = sourceUrl ? `<a class="booking-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">View seats &amp; continue to payment &rarr;</a>` : '';
            return `<article class="result-card ticket-card"><h3>${escapeHtml(title)}</h3><div class="result-details">${details}</div>${link}</article>`;
        }
        if (result.intent === 'jobs') {
            const jobTitle = isNoisyJobValue(title) ? requestedJobRole(prompt) : title;
            const companyCandidate = item.company || item.operator;
            const company = isNoisyJobValue(companyCandidate) ? (item.source || 'Company listed on source') : companyCandidate;
            const link = sourceUrl ? `<a class="booking-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Open application page &rarr;</a>` : '';
            return `<article class="result-card job-card"><h3>${escapeHtml(jobTitle)}</h3><div class="result-details"><span><b>Company:</b> ${escapeHtml(company)}</span></div><p class="fit-comment"><b>Fit:</b> Review the role requirements on the application page against your experience.</p>${link}</article>`;
        }
        const fieldLabels = { source: 'Source', authors: 'Authors', publicationDate: 'Published', summary: 'Summary' };
        const details = Object.entries(item)
            .filter(([key, value]) => fieldLabels[key] && value)
            .map(([key, value]) => `<span><b>${escapeHtml(fieldLabels[key])}:</b> ${escapeHtml(value)}</span>`)
            .join('');
        const link = sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Open source &rarr;</a>` : '';
        return `<article class="result-card"><h3>${escapeHtml(title)}</h3><div class="result-details">${details}</div>${link}</article>`;
    }).join('');

    const emptyMessage = result.intent === 'tickets'
        ? 'Tickets are not available for this movie in the searched theatres.'
        : 'No matching movies, jobs, or research were found.';
    outputConsole.innerHTML = `<div class="result-heading"><span class="success-mark">&#10003;</span><div><p class="result-kicker">${escapeHtml(result.intent)} agent complete</p><h2>Results for “${escapeHtml(prompt)}”</h2></div></div><div class="results-grid">${cards || `<p class="empty-state">${emptyMessage}</p>`}</div>`;
}

async function runAgent() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        promptInput.focus();
        outputConsole.innerHTML = '<p class="error-msg">&gt; Enter a request before running an agent.</p>';
        return;
    }

    runButton.disabled = true;
    liveState.textContent = 'RUNNING';
    liveState.className = 'live-state is-running';
    outputConsole.innerHTML = '<div class="loading-state"><span class="loader"></span><p>Routing your request and opening the right agent...</p></div>';

    try {
        const response = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const responseText = await response.text();
        let result;
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            throw new Error(`The server returned an invalid response (${response.status}). Please restart the local server and try again.`);
        }
        if (!response.ok) throw new Error(result.error || 'The agent could not complete this request.');
        if (result.intent === 'unknown') throw new Error(result.message);
        renderResults(result, prompt);
        liveState.textContent = 'COMPLETE';
        liveState.className = 'live-state is-complete';
    } catch (error) {
        outputConsole.innerHTML = `<p class="error-msg">&gt; ${escapeHtml(error.message)}</p>`;
        liveState.textContent = 'ERROR';
        liveState.className = 'live-state is-error';
    } finally {
        runButton.disabled = false;
    }
}

document.querySelectorAll('.suggestion').forEach(button => {
    button.addEventListener('click', () => {
        promptInput.value = button.dataset.prompt;
        promptInput.focus();
    });
});

runButton.addEventListener('click', runAgent);
promptInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') runAgent();
});
