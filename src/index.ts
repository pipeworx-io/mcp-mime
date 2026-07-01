interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * MIME type lookup MCP.
 *
 * Keyless, offline: map a filename/extension to its MIME (media) type and vice
 * versa, from an inlined table of common types. No API, no key.
 */


const EXT_MIME: Record<string, string> = {
  txt: 'text/plain', html: 'text/html', htm: 'text/html', css: 'text/css', csv: 'text/csv',
  md: 'text/markdown', ics: 'text/calendar', xml: 'application/xml', json: 'application/json',
  jsonld: 'application/ld+json', js: 'text/javascript', mjs: 'text/javascript', ts: 'text/typescript',
  wasm: 'application/wasm', pdf: 'application/pdf', rtf: 'application/rtf', zip: 'application/zip',
  gz: 'application/gzip', tar: 'application/x-tar', '7z': 'application/x-7z-compressed',
  rar: 'application/vnd.rar', bz2: 'application/x-bzip2', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet',
  epub: 'application/epub+zip', jar: 'application/java-archive', bin: 'application/octet-stream',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', ico: 'image/vnd.microsoft.icon', bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff',
  avif: 'image/avif', heic: 'image/heic', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  oga: 'audio/ogg', opus: 'audio/opus', aac: 'audio/aac', flac: 'audio/flac', weba: 'audio/webm',
  mid: 'audio/midi', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg',
  avi: 'video/x-msvideo', mov: 'video/quicktime', mpeg: 'video/mpeg', mkv: 'video/x-matroska',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject', yaml: 'application/yaml', yml: 'application/yaml',
  toml: 'application/toml', sh: 'application/x-sh', php: 'application/x-httpd-php', apk: 'application/vnd.android.package-archive',
};

const MIME_EXT: Record<string, string[]> = {};
for (const [ext, mime] of Object.entries(EXT_MIME)) { (MIME_EXT[mime] ||= []).push(ext); }

const tools: McpToolExport['tools'] = [
  {
    name: 'lookup_mime',
    description: 'Get the MIME (media) type for a filename or extension, e.g. "photo.png" or "png" -> "image/png". Keyless, offline.',
    inputSchema: { type: 'object', properties: { file: { type: 'string', description: 'A filename or bare extension, e.g. "report.pdf" or "pdf".' } }, required: ['file'] },
  },
  {
    name: 'extension_for',
    description: 'Get the file extension(s) for a MIME type, e.g. "image/jpeg" -> ["jpg","jpeg"]. Keyless, offline.',
    inputSchema: { type: 'object', properties: { mime: { type: 'string', description: 'A MIME type, e.g. "application/pdf".' } }, required: ['mime'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'lookup_mime': {
      const file = reqStr(args, 'file', '"report.pdf"');
      const ext = file.includes('.') ? file.split('.').pop()!.toLowerCase() : file.toLowerCase();
      const mime = EXT_MIME[ext];
      return mime ? { input: file, extension: ext, mime } : { input: file, extension: ext, mime: null, reason: 'Unknown extension; defaulting to application/octet-stream is typical.', suggested: 'application/octet-stream' };
    }
    case 'extension_for': {
      const mime = reqStr(args, 'mime', '"application/pdf"').toLowerCase().split(';')[0].trim();
      const exts = MIME_EXT[mime];
      return exts ? { input: mime, extensions: exts } : { input: mime, extensions: null, reason: 'MIME type not in the table.' };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
