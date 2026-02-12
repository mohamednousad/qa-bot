async function checkConflict(context, pr) {
  // GitHub calculates mergeability in the background. 
  // If null, it means GitHub is still computing.
  if (pr.mergeable === false) {
    return {
      status: 'failure',
      title: 'Merge Conflict Detected',
      summary: 'GitHub cannot auto-merge this PR. Please resolve conflicts locally.'
    };
  }
  
  return { status: 'success' };
}

module.exports = checkConflict;