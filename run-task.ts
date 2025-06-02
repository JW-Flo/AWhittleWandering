import { createComponent } from './tasks/createComponent.ts';
import { runLocalBuild } from './tasks/runLocalBuild.ts';
import { pushToRepo } from './tasks/pushToRepo.ts';

async function runTask(task: string) {
  console.log(`[Codex Agent] Running task: ${task}`);

  try {
    let result: string;

    if (task.includes('create')) {
      result = await createComponent({ name: 'Navbar', props: ['title'] });
    } else if (task.includes('build')) {
      result = await runLocalBuild({ target: 'web' });
    } else if (task.includes('push')) {
      result = await pushToRepo({ branch: 'main', message: 'Codex commit' });
    } else {
      throw new Error(`Unknown task input: "${task}"`);
    }

    console.log(`[Codex Agent] Success:`, result);
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : JSON.stringify(e, null, 2);
    console.error(`[Codex Agent] Task failed:`, errorMessage);

    try {
      const healing = await import('./healing/patchAndRetry.ts');
      healing.patchAndRetry(task);
    } catch (healingError) {
      console.error(`[Healing Module Error]:`, healingError);
    }
  }
}

const task = process.argv.slice(2).join(" ") || 'create navbar component';
runTask(task);

