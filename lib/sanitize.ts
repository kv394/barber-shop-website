import sanitizeHtml from 'sanitize-html';

export function sanitize(html: string, options?: sanitizeHtml.IOptions): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'style', 'iframe', 'span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'a', 'ul', 'li', 'ol'
    ]),
    allowedAttributes: {
      '*': ['class', 'id', 'style'],
      'a': ['href', 'name', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    },
    allowedIframeHostnames: ['www.google.com', 'www.youtube.com', 'vimeo.com'],
    ...options,
  });
}

// A more permissive configuration for template rendering (admin-controlled content)
// We remove event handlers (onclick, onerror) to prevent XSS.
export function sanitizeTemplate(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'html', 'head', 'body', 'title', 'meta', 'link', 'style',
      'div', 'span', 'p', 'a', 'br', 'hr', 'wbr',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio', 'track',
      'iframe',
      'form', 'input', 'button', 'select', 'option', 'optgroup', 'textarea', 'label', 'fieldset', 'legend',
      'strong', 'em', 'b', 'i', 'u', 's', 'small', 'sub', 'sup', 'mark', 'del', 'ins', 'abbr', 'cite', 'code', 'pre', 'kbd', 'samp', 'var', 'q', 'blockquote',
      'details', 'summary', 'dialog', 'menu',
      'header', 'footer', 'main', 'nav', 'section', 'article', 'aside', 'address',
      'time', 'data', 'meter', 'progress', 'output',
      'ruby', 'rt', 'rp',
      'bdi', 'bdo',
      'map', 'area',
      'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'text', 'tspan', 'defs', 'use', 'symbol', 'clippath', 'lineargradient', 'radialgradient', 'stop', 'mask', 'pattern', 'foreignobject',
      'canvas', 'noscript', 'template', 'slot',
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'href', 'src', 'alt', 'title', 'width', 'height', 'target', 'rel', 'data-*', 'aria-*', 'role', 'type', 'name', 'value', 'placeholder', 'action', 'method'],
      'a': ['href', 'name', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'sandbox'],
      'form': ['action', 'method', 'enctype', 'name', 'target'],
      'input': ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'checked', 'readonly', 'maxlength', 'min', 'max', 'step', 'pattern', 'autocomplete'],
      'button': ['type', 'name', 'value', 'disabled'],
      'select': ['name', 'disabled', 'required', 'multiple'],
      'option': ['value', 'selected', 'disabled'],
      'textarea': ['name', 'rows', 'cols', 'disabled', 'required', 'placeholder', 'readonly'],
      'label': ['for'],
      'meta': ['charset', 'name', 'content', 'property'],
      'link': ['rel', 'href', 'type', 'media', 'crossorigin'],
      'source': ['src', 'type', 'media', 'srcset', 'sizes'],
      'video': ['src', 'controls', 'width', 'height', 'autoplay', 'loop', 'muted', 'poster', 'preload'],
      'audio': ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
      'track': ['src', 'kind', 'srclang', 'label', 'default'],
    },
  });
}
