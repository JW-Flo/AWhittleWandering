import { createComponent } from './tasks/createComponent';
import { runLocalBuild } from './tasks/runLocalBuild';
import { pushToRepo } from './tasks/pushToRepo';

async function runTask(task: string) {
  console.log(`[Codex Agent] Running task: ${task}`);

  try {
    if (task.includes('create')) {
      await createComponent({ name: 'Navbar', props: ['title'] });
    } else if (task.includes('build')) {
      await runLocalBuild({ target: 'web' });
    } else if (task.includes('push')) {
      await pushToRepo({ branch: 'main', message: 'Codex commit' });
    } else {
      throw new Error('Unknown task');
    }
  } catch (e) {
    console.error(`[Codex Agent] Task failed: ${(e as Error).message}`);
    const healing = await import('./healing/patchAndRetry');
    healing.patchAndRetry(task);
  }
}

const task = process.argv[2];
runTask(task || 'create navbar component');
