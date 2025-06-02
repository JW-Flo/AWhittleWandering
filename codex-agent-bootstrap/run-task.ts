import { createComponent } from './tasks/createComponent.ts';
import { runLocalBuild } from './tasks/runLocalBuild.ts';
import { pushToRepo } from './tasks/pushToRepo.ts';

async function runTask(task: string) {
  console.log(`[Codex Agent] Running task: ${task}`);

  try {
    if (task.includes('create')) {
      const result = await createComponent({ name: 'Navbar', props: ['title'] });
      console.log(result);
    } else if (task.includes('build')) {
      const result = await runLocalBuild({ target: 'web' });
      console.log(result);
    } else if (task.includes('push')) {
      const result = await pushToRepo({ branch: 'main', message: 'Codex commit' });
      console.log(result);
    } else {
      throw new Error('Unknown task');
    }
  } catch (e) {
    console.error(`[Codex Agent] Task failed:`, e?.message || e);
    const healing = await import('./healing/patchAndRetry.ts');
    healing.patchAndRetry(task);
  }
}

const task = process.argv[2] || 'create navbar component';
runTask(task);