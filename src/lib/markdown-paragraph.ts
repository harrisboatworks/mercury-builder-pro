interface MarkdownNodeChild {
  type?: string;
  tagName?: string;
}

interface MarkdownNode {
  children?: MarkdownNodeChild[];
}

export function isStandaloneMarkdownImageParagraph(node: MarkdownNode | undefined): boolean {
  if (node?.children?.length !== 1) return false;

  const [child] = node.children;
  return child.type === 'element' && child.tagName === 'img';
}
