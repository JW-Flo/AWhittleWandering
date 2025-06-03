export async function createComponent({ name, props }: { name: string; props: string[] }) {
  return `[Codex] Creating component ${name} with props: ${props.join(", ")}`;
}