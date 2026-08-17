const CONFIG = {
  respectAcceptHeader: true,
  matchByUserAgent: true,
  allowQueryOverride: true,
  maxOriginBytes: 2 * 1024 * 1024,
  stripSelectors: ['nav', 'footer', 'aside'],
  aiBotPattern: /gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|google-extended|googleother|ccbot|bytespider|amazonbot|applebot-extended|meta-externalagent|cohere-ai|youbot|diffbot|duckassistbot|ai2bot|omgili|timpibot/i,
};

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ref) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X'
        ? parseInt(ref.slice(2), 16)
        : parseInt(ref.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const lower = ref.toLowerCase();
    return lower in ENTITIES ? ENTITIES[lower] : match;
  });
}

function wantsMarkdown(request) {
  const url = new URL(request.url);

  if (CONFIG.allowQueryOverride) {
    const override = url.searchParams.get('format') || url.searchParams.get('_format');
    if (override === 'markdown' || override === 'md') return true;
    if (override === 'html') return false;
  }

  if (CONFIG.respectAcceptHeader) {
    const accept = (request.headers.get('Accept') || '').toLowerCase();
    if (accept.split(',').some((part) => part.trim().startsWith('text/markdown'))) {
      return true;
    }
  }

  if (CONFIG.matchByUserAgent) {
    const ua = request.headers.get('User-Agent') || '';
    if (CONFIG.aiBotPattern.test(ua)) return true;
  }

  return false;
}

class MarkdownWriter {
  constructor() {
    this.out = [];
    this.listStack = [];
    this.linkHrefStack = [];
    this.skipDepth = 0;
    this.preDepth = 0;
    this.cellCount = 0;
    this.pendingHeaderRow = false;
  }

  push(str) {
    if (this.skipDepth === 0) this.out.push(str);
  }

  toString() {
    return this.out
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n';
  }
}

function buildRewriter() {
  const md = new MarkdownWriter();
  const rewriter = new HTMLRewriter();

  [...CONFIG.stripSelectors, 'script', 'style', 'noscript', 'svg', 'head', 'template', 'iframe'].forEach((tag) => {
    rewriter.on(tag, {
      element(el) {
        md.skipDepth += 1;
        el.onEndTag(() => {
          md.skipDepth = Math.max(0, md.skipDepth - 1);
        });
      },
    });
  });

  [1, 2, 3, 4, 5, 6].forEach((level) => {
    rewriter.on(`h${level}`, {
      element(el) {
        md.push(`\n\n${'#'.repeat(level)} `);
        el.onEndTag(() => md.push('\n\n'));
      },
    });
  });

  rewriter.on('p', {
    element(el) {
      md.push('\n\n');
      el.onEndTag(() => md.push('\n\n'));
    },
  });

  rewriter.on('br', { element() { md.push('  \n'); } });
  rewriter.on('hr', { element() { md.push('\n\n---\n\n'); } });

  rewriter.on('strong, b', {
    element(el) {
      md.push('**');
      el.onEndTag(() => md.push('**'));
    },
  });

  rewriter.on('em, i', {
    element(el) {
      md.push('_');
      el.onEndTag(() => md.push('_'));
    },
  });

  rewriter.on('code', {
    element(el) {
      if (md.preDepth > 0) return;
      md.push('`');
      el.onEndTag(() => md.push('`'));
    },
  });

  rewriter.on('pre', {
    element(el) {
      md.preDepth += 1;
      md.push('\n\n```\n');
      el.onEndTag(() => {
        md.push('\n```\n\n');
        md.preDepth = Math.max(0, md.preDepth - 1);
      });
    },
  });

  rewriter.on('a', {
    element(el) {
      const href = el.getAttribute('href') || '';
      md.linkHrefStack.push(href);
      md.push('[');
      el.onEndTag(() => {
        const url = md.linkHrefStack.pop() || '';
        md.push(`](${url})`);
      });
    },
  });

  rewriter.on('img', {
    element(el) {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      md.push(`![${alt}](${src})`);
    },
  });

  rewriter.on('blockquote', {
    element(el) {
      md.push('\n\n> ');
      el.onEndTag(() => md.push('\n\n'));
    },
  });

  rewriter.on('ul', {
    element(el) {
      md.listStack.push({ type: 'ul', index: 0 });
      el.onEndTag(() => {
        md.listStack.pop();
        md.push('\n');
      });
    },
  });

  rewriter.on('ol', {
    element(el) {
      md.listStack.push({ type: 'ol', index: 0 });
      el.onEndTag(() => {
        md.listStack.pop();
        md.push('\n');
      });
    },
  });

  rewriter.on('li', {
    element() {
      const depth = Math.max(0, md.listStack.length - 1);
      const indent = '  '.repeat(depth);
      const top = md.listStack[md.listStack.length - 1];
      if (top) {
        top.index += 1;
        const bullet = top.type === 'ol' ? `${top.index}. ` : '- ';
        md.push(`\n${indent}${bullet}`);
      } else {
        md.push('\n- ');
      }
    },
  });

  rewriter.on('table', {
    element(el) {
      md.push('\n\n');
      el.onEndTag(() => md.push('\n\n'));
    },
  });

  rewriter.on('tr', {
    element(el) {
      md.cellCount = 0;
      md.push('|');
      el.onEndTag(() => {
        md.push('\n');
        if (md.pendingHeaderRow) {
          md.push('|' + ' --- |'.repeat(md.cellCount));
          md.push('\n');
          md.pendingHeaderRow = false;
        }
      });
    },
  });

  rewriter.on('th, td', {
    element(el) {
      md.cellCount += 1;
      if (el.tagName === 'th') md.pendingHeaderRow = true;
      el.onEndTag(() => md.push(' |'));
    },
  });

  rewriter.on('*', {
    text(chunk) {
      if (!chunk.text) return;

      if (md.preDepth > 0) {
        md.push(decodeEntities(chunk.text));
        return;
      }

      const collapsed = chunk.text.replace(/\s+/g, ' ');
      if (collapsed.trim() === '') {
        if (collapsed.length > 0) md.push(' ');
        return;
      }
      md.push(decodeEntities(collapsed));
    },
  });

  return { rewriter, md };
}

async function convertToMarkdown(originResponse) {
  const { rewriter, md } = buildRewriter();
  await rewriter.transform(originResponse).text();

  const headers = new Headers();
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', 'Accept, User-Agent');
  headers.set('Cache-Control', originResponse.headers.get('Cache-Control') || 'public, max-age=300');
  headers.set('X-Markdown-Source', 'edge-html-to-markdown');

  return new Response(md.toString(), { status: 200, headers });
}

export default async function handler(request, _context) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fetch(request);
  }

  if (!wantsMarkdown(request)) {
    return fetch(request);
  }

  const originHeaders = new Headers(request.headers);
  originHeaders.set('Accept', 'text/html,application/xhtml+xml');
  const originResponse = await fetch(request, { headers: originHeaders });

  const contentType = originResponse.headers.get('Content-Type') || '';
  if (!originResponse.ok || !contentType.includes('text/html')) {
    return originResponse;
  }

  const contentLength = Number(originResponse.headers.get('Content-Length') || 0);
  if (contentLength && contentLength > CONFIG.maxOriginBytes) {
    return originResponse;
  }

  return convertToMarkdown(originResponse);
}
