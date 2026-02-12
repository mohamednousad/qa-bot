const cloneRepo = require('./utils/clone');
const cleanup = require('./utils/cleanup');
const checkConflict = require('./checks/conflict');
const runLint = require('./checks/lint');
const checkStructure = require('./checks/structure');

/**
 * This is the main entrypoint to your Probot app
 */
module.exports = (app) => {
  app.log.info("MERN QA Bot is alive!");

  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;
    
    // 1. Tell GitHub "I am working on it..."
    const checkRun = await context.octokit.checks.create({
      owner: context.repo().owner,
      repo: context.repo().repo,
      name: "MERN QA Bot",
      head_sha: pr.head.sha,
      status: "in_progress",
      started_at: new Date(),
    });

    let tempDir = null;

    try {
      // 2. Check Merge Conflicts
      const conflictResult = await checkConflict(context, pr);
      if (conflictResult.status === 'failure') {
        await context.octokit.checks.update({
          owner: context.repo().owner,
          repo: context.repo().repo,
          check_run_id: checkRun.data.id,
          status: "completed",
          conclusion: "failure",
          output: conflictResult
        });
        return;
      }

      // 3. Clone Code
      tempDir = await cloneRepo(pr.head.repo.clone_url, pr.head.ref, pr.number);

      // 4. Run Linting
      const lintErrors = await runLint(tempDir);
      
      // 5. Run Structure Check
      const structureErrors = await checkStructure(tempDir);

      // Combine errors
      const allErrors = [...lintErrors, ...structureErrors];
      const isSuccess = allErrors.length === 0;

      // 6. Report to GitHub
      // Note: GitHub API allows max 50 annotations per request. We take the first 50.
      const annotations = allErrors.slice(0, 50);

      await context.octokit.checks.update({
        owner: context.repo().owner,
        repo: context.repo().repo,
        check_run_id: checkRun.data.id,
        status: "completed",
        conclusion: isSuccess ? "success" : "failure",
        output: {
          title: isSuccess ? "All Checks Passed" : `Found ${allErrors.length} Issues`,
          summary: isSuccess ? "Code follows MERN standards." : "Please fix the issues below.",
          annotations: annotations
        }
      });

    } catch (error) {
      console.error(error);
      await context.octokit.checks.update({
        owner: context.repo().owner,
        repo: context.repo().repo,
        check_run_id: checkRun.data.id,
        status: "completed",
        conclusion: "failure",
        output: {
          title: "Bot Error",
          summary: "Something went wrong while checking the code: " + error.message
        }
      });
    } finally {
      // 7. Cleanup
      if (tempDir) await cleanup(tempDir);
    }
  });
};