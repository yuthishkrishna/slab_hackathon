const { makeSearchUrl } = require('./platformSearch');

const ticketPlatforms = [
    { kind: 'tickets', name: 'BookMyShow', homeUrl: 'https://in.bookmyshow.com/', searchUrl: query => makeSearchUrl('https://in.bookmyshow.com/search/', query), searchInputs: ['input[placeholder*="Search" i]', 'input[type="search"]'] },
    { kind: 'tickets', name: 'District', homeUrl: 'https://www.district.in/', searchUrl: query => makeSearchUrl('https://www.district.in/search', query), searchInputs: ['input[placeholder*="Search" i]', 'input[type="search"]'] },
    { kind: 'tickets', name: 'Paytm Movies', homeUrl: 'https://paytm.com/movies', searchUrl: 'https://paytm.com/movies', searchInputs: ['input[placeholder*="Search" i]', 'input[type="search"]'] },
    { kind: 'tickets', name: 'TicketsNew', homeUrl: 'https://www.ticketsnew.com/', searchUrl: query => makeSearchUrl('https://www.ticketsnew.com/search', query), searchInputs: ['input[placeholder*="Search" i]', 'input[type="search"]'] },
    { kind: 'tickets', name: 'RedBus', homeUrl: 'https://www.redbus.in/', searchUrl: 'https://www.redbus.in/', searchInputs: ['input[placeholder*="From" i]', 'input[placeholder*="Source" i]'] },
    { kind: 'tickets', name: 'MakeMyTrip', homeUrl: 'https://www.makemytrip.com/bus-tickets/', searchUrl: 'https://www.makemytrip.com/bus-tickets/', searchInputs: ['input[placeholder*="From" i]', 'input[aria-label*="From" i]'] },
    { kind: 'tickets', name: 'Ixigo', homeUrl: 'https://www.ixigo.com/bus', searchUrl: 'https://www.ixigo.com/bus', searchInputs: ['input[placeholder*="From" i]', 'input[aria-label*="From" i]'] }
];

const jobPlatforms = [
    { kind: 'jobs', name: 'LinkedIn', homeUrl: 'https://www.linkedin.com/jobs/', searchUrl: query => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`, searchInputs: ['input[placeholder*="Search jobs" i]', 'input[aria-label*="Search" i]'] },
    { kind: 'jobs', name: 'Indeed', homeUrl: 'https://www.indeed.com/', searchUrl: query => `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`, searchInputs: ['input[name="q"]', 'input[placeholder*="What" i]'] },
    { kind: 'jobs', name: 'Naukri', homeUrl: 'https://www.naukri.com/', searchUrl: query => `https://www.naukri.com/${encodeURIComponent(query).replace(/%20/g, '-')}-jobs`, searchInputs: ['input[placeholder*="Search jobs" i]', 'input[name="qp"]'] },
    { kind: 'jobs', name: 'YC Companies', homeUrl: 'https://www.ycombinator.com/jobs', searchUrl: query => `https://www.ycombinator.com/jobs/role/${encodeURIComponent(query).replace(/%20/g, '-')}`, searchInputs: ['input[placeholder*="Search" i]'] }
];

const academicPlatforms = [
    { kind: 'academic', name: 'arXiv', homeUrl: 'https://arxiv.org/', searchUrl: query => `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`, searchInputs: ['input[name="query"]'] },
    { kind: 'academic', name: 'PubMed', homeUrl: 'https://pubmed.ncbi.nlm.nih.gov/', searchUrl: query => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`, searchInputs: ['input[name="term"]', 'input[type="search"]'] },
    { kind: 'academic', name: 'Crossref', homeUrl: 'https://search.crossref.org/', searchUrl: query => `https://search.crossref.org/?q=${encodeURIComponent(query)}`, searchInputs: ['input[type="search"]'] }
];

module.exports = { ticketPlatforms, jobPlatforms, academicPlatforms };
