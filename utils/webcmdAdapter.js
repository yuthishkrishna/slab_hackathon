const fs = require('fs');
const path = require('path');

// Simulates webcmd's ability to explore once and reuse commands
class WebcmdAdapter {
    constructor(domain, fileName = `${domain}_adapter.json`) {
        this.domain = domain;
        this.memoryPath = path.join(__dirname, `../memory/${fileName}`);
        this.initializeMemory();
    }

    initializeMemory() {
        fs.mkdirSync(path.dirname(this.memoryPath), { recursive: true });
        if (!fs.existsSync(this.memoryPath)) {
            fs.writeFileSync(this.memoryPath, JSON.stringify({ version: 1, domain: this.domain, selectors: {}, routines: {}, rescans: [] }, null, 2));
        }
        try {
            this.memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
        } catch {
            this.memory = { version: 1, domain: this.domain, selectors: {}, routines: {}, rescans: [] };
        }
        this.memory.selectors ||= {};
        this.memory.routines ||= {};
        this.memory.rescans ||= [];
    }

    getSelector(key) {
        return this.memory.selectors[key] || null;
    }

    rememberSelector(key, selector) {
        if (selector && this.memory.selectors[key] !== selector) {
            this.memory.selectors[key] = selector;
            this.saveMemory();
        }
        return selector;
    }

    async getOrLearnSelector(page, key, fallbackSelector) {
        return this.getSelector(key) || this.rememberSelector(key, fallbackSelector);
    }

    markRescout(key, candidates) {
        this.memory.rescans = [{ key, candidates, at: new Date().toISOString() }, ...this.memory.rescans].slice(0, 20);
        this.saveMemory();
    }

    saveMemory() {
        fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2));
    }
}

module.exports = WebcmdAdapter;