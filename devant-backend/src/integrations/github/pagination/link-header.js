function parseLinkHeader(linkHeader) {
  if (!linkHeader || typeof linkHeader !== 'string') return {};

  const links = {};
  for (const chunk of linkHeader.split(',')) {
    const match = chunk.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (!match) continue;
    const [, url, rel] = match;
    links[rel] = url;
  }

  return links;
}

function extractPagination(response) {
  const link = response?.headers?.link;
  const links = parseLinkHeader(link);

  return {
    next: links.next || null,
    prev: links.prev || null,
    first: links.first || null,
    last: links.last || null,
    raw: links,
  };
}

module.exports = {
  parseLinkHeader,
  extractPagination,
};
