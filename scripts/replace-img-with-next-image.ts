// jscodeshift codemod to replace <img> with Next.js Image component
import { Transform } from 'jscodeshift';

const transformer: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find JSXOpeningElement named 'img'
  root.find(j.JSXOpeningElement, { name: { name: 'img' } }).forEach(path => {
    const attributes = path.node.attributes;
    // Extract src, alt, width, height, etc.
    const attrMap: Record<string, any> = {};
    attributes.forEach(attr => {
      if (attr.type === 'JSXAttribute' && attr.name && attr.name.name) {
        attrMap[attr.name.name] = attr.value;
      }
    });
    // Build new Image component
    const newAttributes = [];
    if (attrMap['src']) newAttributes.push(j.jsxAttribute(j.jsxIdentifier('src'), attrMap['src']));
    if (attrMap['alt']) newAttributes.push(j.jsxAttribute(j.jsxIdentifier('alt'), attrMap['alt']));
    if (attrMap['width']) newAttributes.push(j.jsxAttribute(j.jsxIdentifier('width'), attrMap['width']));
    if (attrMap['height']) newAttributes.push(j.jsxAttribute(j.jsxIdentifier('height'), attrMap['height']));
    // Add placeholder layout="responsive" if width & height present
    if (attrMap['width'] && attrMap['height']) {
      newAttributes.push(j.jsxAttribute(j.jsxIdentifier('layout'), j.literal('responsive')));
    }
    const imageElement = j.jsxOpeningElement(j.jsxIdentifier('Image'), newAttributes, true);
    // Replace opening element
    path.replace(imageElement);
    // Also replace closing tag if exists (self-closing case handled above)
    const closing = path.parentPath?.node?.closingElement;
    if (closing && closing.type === 'JSXClosingElement' && closing.name.name === 'img') {
      closing.name.name = 'Image';
    }
  });

  // Ensure import of Image from 'next/image' exists
  const hasImport = root.find(j.ImportDeclaration, { source: { value: 'next/image' } }).size() > 0;
  if (!hasImport) {
    const importDecl = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier('Image'))],
      j.literal('next/image')
    );
    root.get().node.program.body.unshift(importDecl);
  }

  return root.toSource({ quote: 'single' });
};

export default transformer;
