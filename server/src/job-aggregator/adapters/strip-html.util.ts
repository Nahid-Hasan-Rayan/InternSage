// © 2026 Nahid Hasan Rayan. All rights reserved.

// Both RSS and Arbeitnow hand back description text that can contain
// raw HTML (RSS <description> tags very often do; Arbeitnow's API
// does too). Neither adapter should be writing markup into
// JobPosting.description — the frontend renders it as plain text,
// and until now RSS-sourced postings would show literal <p> tags on
// the page. One shared implementation so both adapters (and any
// future ones) treat this the same way instead of each doing their
// own partial version of it.

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
