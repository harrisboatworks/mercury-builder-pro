interface MarkdownNodeChild {
  type?: string;
  tagName?: string;
}

interface MarkdownNode {
  children?: MarkdownNodeChild[];
}

export function shouldUnwrapMarkdownImageParagraph(node: MarkdownNode | undefined): boolean {
  return node?.children?.some(
    (child) => child.type === 'element' && child.tagName === 'img',
  ) ?? false;
}
