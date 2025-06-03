console.log("[Boot] Starting Codex Agent runner...");

let createComponent, runLocalBuild, pushToRepo;

try {
  ({ createComponent } = await import('./tasks/createComponent.ts'));
  ({ runLocalBuild } = await import('./tasks/runLocalBuild.ts'));
  ({ pushToRepo } = await import('./tasks/pushToRepo.ts'));

  console.log("[Boot] All task modules imported successfully.");
} catch (e) {
  console.error("[Boot] Module import failed!");
  console.error(e instanceof Error ? e.stack : e);
  process.exit(1);
}

async function runTask(task: string) {
  console.log(`[Codex Agent] Running task: ${task}`);
  try {
    let result = '';
    if (task.includes('create')) {
      console.log("[Debug] Entering create block");
      result = await createComponent({ name: 'Navbar', props: ['title'] });
    } else if (task.includes('build')) {
      console.log("[Debug] Entering build block");
      result = await runLocalBuild({ target: 'web' });
    } else if (task.includes('push')) {
      console.log("[Debug] Entering push block");
      result = await pushToRepo({ branch: 'main', message: 'Codex commit' });
    } else {
      throw new Error(`Unknown task input: "${task}"`);
    }
    console.log(`[Codex Agent] Success: ${result}`);
  } catch (e) {
    console.error(`[Codex Agent] Error Caught:\n`);
    if (e instanceof Error) console.error(e.stack || e.message);
    else console.error(JSON.stringify(e));
    try {
      const healing = await import('./healing/patchAndRetry.ts');
      healing.patchAndRetry(task);
    } catch (healErr) {
      console.error('[Healing Error]', healErr);
    }
  }
}

const task = process.argv.slice(2).join(" ").trim();
console.log("[Debug] Parsed task input:", task);

if (!task) {
  console.error("[Codex Agent] No task argument provided.");
  process.exit(1);
}

console.log("[Debug] Starting runTask()...");
runTask(task)
  .then(() => console.log("[Debug] runTask() completed"))
  .catch((err) => {
    console.error("[Debug] runTask() failed unexpectedly:");
    console.error(err instanceof Error ? err.stack : err);
  });