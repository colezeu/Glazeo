import { SEOHead, SEO_PAGES } from "./SEOHead";

/**
 * Wrapper care adaugă SEO tags pe fiecare pagină
 * Usage: <PageWithSEO page="balustrade"><BalustradeConfiguratorPage /></PageWithSEO>
 */
export function PageWithSEO({ page, children }) {
  const seo = SEO_PAGES[page] || {};
  return (
    <>
      <SEOHead title={seo.title} description={seo.description} />
      {children}
    </>
  );
}
