export const generateFrontUrlWithSlug = (slug: string, url: string): string => {
  const fullUrl = new URL(url);

  fullUrl.hostname = `${slug}.${fullUrl.hostname}`;

  return fullUrl.toString();
};
