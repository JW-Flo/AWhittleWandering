export async function pushToRepo({ branch, message }: { branch: string; message: string }) {
  return `[Codex] Pushing code to ${branch} with message: '${message}'`;
}