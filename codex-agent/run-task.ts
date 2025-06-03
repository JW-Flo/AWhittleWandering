import * as fs from 'fs';

try {
  const { createComponent } = await import('./tasks/createComponent.ts');
  const { runLocalBuild } = await import('./tasks/runLocalBuild.ts');
  const { pushToRepo } = await import('./tasks/pushToRepo.ts');

  const task = process.argv.slice(2).join(" ").trim();
  console.log("[Debug] Parsed task:", task);

  if (!task) {
    console.error("[Codex Agent] No task input provided.");
    process.exit(1);
  }

  let result = "";

  if (task.includes("create")) {
    console.log("[Debug] Running createComponent");
    result = await createComponent({ name: "Navbar", props: ["title"] });
  } else if (task.includes("build")) {
    console.log("[Debug] Running runLocalBuild");
    result = await runLocalBuild({ target: "web" });
  } else if (task.includes("push")) {
    console.log("[Debug] Running pushToRepo");
    result = await pushToRepo({ branch: "main", message: "Codex commit" });
  } else {
    console.log("[Codex Agent] Unknown task.");
    process.exit(1);
  }

  console.log("[Codex Agent] Success:", result);
} catch (err) {
  console.log("[Codex Agent] FATAL ERROR:");
  if (err instanceof Error) {
    console.error(err.message);
    console.error(err.stack);
  } else {
    console.error(JSON.stringify(err, null, 2));
  }

  try {
    const healing = await import('./healing/patchAndRetry.ts');
    healing.patchAndRetry(process.argv.slice(2).join(" "));
  } catch (e) {
    console.error("[Codex Agent] Healing failed:", e);
  }

  process.exit(1);
}

