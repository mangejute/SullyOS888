/** EPUB 是 ZIP 容器；这里只提取书名、作者和阅读正文，不保存原始压缩包。 */
export type EpubTextResult = {
    text: string;
    title?: string;
    author?: string;
    chapterCount: number;
    /** 按 EPUB spine 的真实阅读顺序保留的章节，供书库目录使用。 */
    chapters: EpubTextChapter[];
};

export type EpubTextChapter = { title: string; partTitle?: string; text: string };
type EpubTocEntry = Pick<EpubTextChapter, 'title' | 'partTitle'>;

type ZipEntry = { async: (type: 'string') => Promise<string> };
type ZipLike = { file: (name: string) => ZipEntry | null };

export const isEpubFile = (file: Pick<File, 'name' | 'type'>): boolean =>
    file.type.toLowerCase() === 'application/epub+zip' || /\.epub$/i.test(file.name);

const textOf = (node: Element | undefined): string => (node?.textContent || '').replace(/\s+/g, ' ').trim();

const resolvePath = (baseFile: string, relativePath: string): string => {
    const base = baseFile.split('/');
    base.pop();
    for (const part of relativePath.replace(/\\/g, '/').split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') base.pop();
        else base.push(part);
    }
    return base.join('/');
};

const parseXml = (source: string, label: string): Document => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error(`${label} 格式异常`);
    return doc;
};

const chapterText = (source: string): string => {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    doc.querySelectorAll('script,style,svg,nav,aside,form,header,footer').forEach(node => node.remove());
    const root = doc.body || doc.documentElement;
    // 保住标题和段落边界，避免章节全文粘成一行。
    return Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,div'))
        .map(node => textOf(node))
        .filter(Boolean)
        .filter((text, index, all) => index === 0 || text !== all[index - 1])
        .join('\n\n')
        .trim();
};

const chapterTitle = (source: string, fallback: string): string => {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    const heading = doc.querySelector('h1,h2,h3,title');
    return textOf(heading || undefined) || fallback;
};

/** EPUB3 nav.xhtml / EPUB2 toc.ncx 都可能给出比正文 h1 更准确的目录标题。 */
const tocTitles = async (zip: ZipLike, opf: Document, opfPath: string): Promise<Map<string, EpubTocEntry>> => {
    const titles = new Map<string, EpubTocEntry>();
    const items = Array.from(opf.getElementsByTagName('item'));
    const nav = items.find(item => (item.getAttribute('properties') || '').split(/\s+/).includes('nav'))
        || items.find(item => item.getAttribute('media-type') === 'application/x-dtbncx+xml');
    const href = nav?.getAttribute('href');
    if (!href) return titles;
    const path = resolvePath(opfPath, href);
    const entry = zip.file(path);
    if (!entry) return titles;
    const source = await entry.async('string');
    if (/\.ncx$/i.test(path) || /<navMap\b/i.test(source)) {
        const doc = parseXml(source, 'EPUB 目录');
        const walk = (point: Element, parentTitle?: string) => {
            const children = Array.from(point.children).filter(node => node.tagName === 'navPoint');
            const src = Array.from(point.children).find(node => node.tagName === 'content')?.getAttribute('src')?.split('#')[0];
            const labelNode = Array.from(point.children).find(node => node.tagName === 'navLabel')?.getElementsByTagName('text')[0];
            const label = textOf(labelNode);
            if (src && label) titles.set(resolvePath(path, src), { title: label, partTitle: parentTitle });
            children.forEach(child => walk(child, children.length ? label || parentTitle : parentTitle));
        };
        Array.from(doc.getElementsByTagName('navMap')[0]?.children || []).filter(node => node.tagName === 'navPoint').forEach(point => walk(point));
    } else {
        const doc = new DOMParser().parseFromString(source, 'text/html');
        const navs = Array.from(doc.querySelectorAll('nav'));
        const tocNav = navs.find(nav => /(^|\s)toc(\s|$)/i.test(nav.getAttribute('epub:type') || '') || nav.getAttribute('role') === 'doc-toc') || navs[0];
        const walk = (list: Element, parentTitle?: string) => {
            Array.from(list.children).filter(node => node.tagName === 'LI').forEach(item => {
                const link = Array.from(item.children).find(node => node.tagName === 'A') as HTMLAnchorElement | undefined;
                const childList = Array.from(item.children).find(node => node.tagName === 'OL' || node.tagName === 'UL');
                const title = textOf(link);
                const target = link?.getAttribute('href')?.split('#')[0];
                if (target && title) titles.set(resolvePath(path, target), { title, partTitle: parentTitle });
                if (childList) walk(childList, title || parentTitle);
            });
        };
        const list = tocNav && Array.from(tocNav.children).find(node => node.tagName === 'OL' || node.tagName === 'UL');
        if (list) walk(list);
    }
    return titles;
};

/** 解析标准 EPUB 2/3 的 OPF spine，按阅读顺序提取章节正文。 */
export async function extractEpubText(file: File, options: { onProgress?: (done: number, total: number) => void } = {}): Promise<EpubTextResult> {
    if (file.size > 80 * 1024 * 1024) throw new Error('EPUB 文件超过 80MB，暂不支持导入');
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file) as unknown as ZipLike;
    const container = zip.file('META-INF/container.xml');
    if (!container) throw new Error('不是有效的 EPUB：缺少书籍目录');

    const containerDoc = parseXml(await container.async('string'), 'EPUB 目录');
    const opfPath = containerDoc.getElementsByTagName('rootfile')[0]?.getAttribute('full-path') || '';
    if (!opfPath) throw new Error('不是有效的 EPUB：找不到书籍信息');
    const opfEntry = zip.file(opfPath);
    if (!opfEntry) throw new Error('EPUB 的书籍信息文件不存在');

    const opf = parseXml(await opfEntry.async('string'), 'EPUB 书籍信息');
    const title = textOf(opf.getElementsByTagName('dc:title')[0] || opf.getElementsByTagName('title')[0]);
    const author = textOf(opf.getElementsByTagName('dc:creator')[0] || opf.getElementsByTagName('creator')[0]);
    const manifest = new Map<string, string>();
    Array.from(opf.getElementsByTagName('item')).forEach(item => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        if (id && href) manifest.set(id, resolvePath(opfPath, href));
    });
    const spine = Array.from(opf.getElementsByTagName('itemref'))
        .map(item => manifest.get(item.getAttribute('idref') || ''))
        .filter((path): path is string => Boolean(path));
    if (spine.length === 0) throw new Error('EPUB 中没有可阅读的章节');
    const toc = await tocTitles(zip, opf, opfPath);

    const chapters: EpubTextChapter[] = [];
    for (let index = 0; index < spine.length; index += 1) {
        options.onProgress?.(index + 1, spine.length);
        const entry = zip.file(spine[index]);
        if (!entry) continue;
        const source = await entry.async('string');
        const text = chapterText(source);
        if (text) {
            const tocEntry = toc.get(spine[index]);
            chapters.push({ title: tocEntry?.title || chapterTitle(source, `第 ${chapters.length + 1} 章`), partTitle: tocEntry?.partTitle, text });
        }
    }
    const text = chapters.map(chapter => chapter.text).join('\n\n\n').trim();
    if (!text) throw new Error('EPUB 中没有可提取的文字内容');
    return { text, title: title || undefined, author: author || undefined, chapterCount: chapters.length, chapters };
}
