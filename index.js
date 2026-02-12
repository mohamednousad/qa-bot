/**
 * A Zero-Dependency QA Bot
 */
module.exports = (app) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;

    // 1. Tell GitHub: "I am starting my check!"
    const checkRun = await context.octokit.checks.create({
      owner: context.repo().owner,
      repo: context.repo().repo,
      name: "Basic QA Check",
      head_sha: pr.head.sha,
      status: "in_progress",
    });

    // 2. Our simple rule: The PR title cannot contain "WIP"
    const isWip = pr.title.toUpperCase().includes("WIP");
    const passed = !isWip;

    // 3. Tell GitHub the final result (Green Check ✅ or Red Cross ❌)
    await context.octokit.checks.update({
      owner: context.repo().owner,
      repo: context.repo().repo,
      check_run_id: checkRun.data.id,
      status: "completed",
      conclusion: passed ? "success" : "failure",
      output: {
        title: passed ? "All Good!" : "PR is not ready",
        summary: passed ? "No 'WIP' in title. Ready to review." : "Please remove 'WIP' from the PR title."
      }
    });
  });
};