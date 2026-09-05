// © 2026 Nahid Hasan Rayan. All rights reserved.

import { stripHtml } from './strip-html.util';

describe('stripHtml', () => {
  it('removes tags entirely, replacing them with a space so words on either side stay separated', () => {
    expect(stripHtml('<p>Hello</p><p>World</p>')).toBe('Hello World');
  });

  it('decodes the handful of entities RSS/Arbeitnow actually send', () => {
    expect(stripHtml('Tom &amp; Jerry&#x27;s &quot;show&quot;')).toBe('Tom & Jerry\'s "show"');
  });

  it('collapses runs of whitespace left behind by stripped tags into single spaces', () => {
    expect(stripHtml('<ul>\n<li>One</li>\n<li>Two</li>\n</ul>')).toBe('One Two');
  });

  it('leaves already-plain text untouched', () => {
    expect(stripHtml('Just a normal description, no markup here.')).toBe('Just a normal description, no markup here.');
  });

  it('returns an empty string for empty input rather than throwing', () => {
    expect(stripHtml('')).toBe('');
  });
});
