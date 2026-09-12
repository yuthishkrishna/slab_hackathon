const readline = require('readline-sync');

function requireHumanApproval(actionDescription) {
    console.log(`\n[SAFETY CHECK] The agent is about to: ${actionDescription}`);
    const answer = readline.question('Do you approve this action? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
        console.log('[SAFETY CHECK] Action aborted by user.');
        process.exit(1);
    }
    console.log('[SAFETY CHECK] Action approved. Proceeding...\n');
}

module.exports = { requireHumanApproval };