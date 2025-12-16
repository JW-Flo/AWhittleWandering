import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

export const SEOHead = ({
  title = "A Whittle Wandering - Track Your Adventures Across the World",
  description = "Document and share your epic road trips with interactive maps, real-time vehicle tracking, and beautiful analytics. Join the adventure community.",
  image = "https://www.awhittlewandering.com/og-image.jpg",
  url = "https://www.awhittlewandering.com",
  type = "website",
  noindex = false,
}: SEOHeadProps) => {
  const fullTitle = title.includes("A Whittle Wandering") 
    ? title 
    : `${title} | A Whittle Wandering`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="A Whittle Wandering" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "A Whittle Wandering",
          "alternateName": "AWW",
          "url": "https://www.awhittlewandering.com",
          "logo": "https://www.awhittlewandering.com/og-image.jpg",
          "description": "Track your adventures across the world with interactive maps and real-time vehicle analytics.",
          "sameAs": []
        })}
      </script>

      {/* Structured Data - WebSite with SearchAction */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "A Whittle Wandering",
          "url": "https://www.awhittlewandering.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.awhittlewandering.com/explore?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};
