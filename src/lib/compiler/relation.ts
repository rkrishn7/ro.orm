import { AliasMap, Node } from '../../types/search';

type RelationNode = { name: string; children: RelationNode[] };
type RelationExpression = string;

export default class Relation {
  tree!: RelationNode;
  expression!: RelationExpression;
  /**
   * Constructs a new relation for the given tree
   * @param ast the root node in the tree
   * @param aliases a set of aliases to be mapped
   */
  constructor(ast: Node, aliases?: AliasMap) {
    this.tree = { name: '', children: [] };
    this.buildTree(ast, aliases);
    this.expression = this.buildExpression(this.tree);
  }

  private buildTree(node: Node, aliases?: AliasMap) {
    if (node.type === 'logical') {
      node.constraints.map((c) => this.buildTree(c, aliases));
    } else if (node.type === 'comparison') {
      const {
        args: { identifier },
      } = node;
      if (aliases && identifier in aliases) {
        node.args.identifier = aliases[identifier];
      }
      const tokens = node.args.identifier.split('.');
      let top = this.tree;
      for (let i = 0; i < tokens.length - 1; ++i) {
        const node = top.children.find((child) => child.name === tokens[i]);

        if (!node) {
          top =
            top.children[
              top.children.push({ name: tokens[i], children: [] }) - 1
            ];
        } else {
          top = node;
        }
      }
    }
  }

  buildExpression(node: RelationNode): RelationExpression {
    const { name, children } = node;
    if (children.length === 0) {
      return name;
    } else if (children.length === 1) {
      return `${name}${name && '.'}${this.buildExpression(children[0])}`;
    } else {
      return `${name}${name && '.'}[${children
        .map((child) => this.buildExpression(child))
        .join(',')}]`;
    }
  }
}
