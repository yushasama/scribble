/**
 * Remark Plugin for Source Mapping
 * Injects data-pos-start and data-pos-end attributes into rendered elements
 */

import { visit } from 'unist-util-visit';
import type { Node, Position } from 'unist';

interface NodeWithPosition extends Node {
  position?: Position;
}

export function remarkSourceMap() {
  return (tree: Node) => {
    let processedCount = 0;
    
    visit(tree, (node: NodeWithPosition) => {
      // Only process nodes with position data
      if (!node.position?.start?.line) return;

      // Add position data to the node for later use
      (node as unknown as Record<string, unknown>).data = (node as unknown as Record<string, unknown>).data || {};
      const data = (node as unknown as Record<string, unknown>).data as Record<string, unknown>;
      data.hProperties = {
        ...(data.hProperties || {}),
        'data-pos-start': node.position.start.line,
        'data-pos-end': node.position.end.line,
      };
      
      processedCount++;
    });
  };
}

export default remarkSourceMap

// Alternative: Direct DOM manipulation approach
export function injectSourceMapAttributes(): void {
  // This is a fallback method that can be used if remark plugin doesn't work
  // It would require parsing the markdown and mapping it to DOM elements
  // For now, we'll rely on the remark plugin approach
}
