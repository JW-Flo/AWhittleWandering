import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export const SEOHead = ({
  title = "A Whittle Wandering - Track Your Adventures Across the World",
  description = "Document and share your epic road trips with interactive maps, real-time vehicle tracking, and beautiful analytics. Join the adventure community.",
  image = "https://www.awhittlewandering.com/og-image.jpg",
  url = "https://www.awhittlewandering.com",
  type = "website",
  noindex = false,
  jsonLd,
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

      {/* Custom JSON-LD if provided */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {/* Default Structured Data - Organization */}
      {!jsonLd && (
        <>
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
        </>
      )}
    </Helmet>
  );
};

// Pre-built JSON-LD for the flagship journey
export const flagshipJourneyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAction',
  name: 'A Whittle Wandering - 48 State Tesla Road Trip',
  description: 'An 89-day journey across all 48 contiguous United States in a Tesla Model Y named Shadowfax. 15,847 miles traveled, 6,915 kWh consumed, 259 charging sessions.',
  agent: {
    '@type': 'Person',
    name: 'Joe Whittle'
  },
  startTime: '2025-06-03',
  endTime: '2025-08-31',
  fromLocation: {
    '@type': 'Place',
    name: 'Corpus Christi, Texas',
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.8006,
      longitude: -97.3964
    }
  },
  toLocation: {
    '@type': 'Place',
    name: 'Corpus Christi, Texas',
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.8006,
      longitude: -97.3964
    }
  },
  distance: {
    '@type': 'Distance',
    name: '15,847 miles'
  },
  result: {
    '@type': 'TravelEvent',
    name: '48 State Road Trip Completion',
    about: [
      {
        '@type': 'State',
        name: '48 US States Visited'
      }
    ]
  },
  instrument: {
    '@type': 'Vehicle',
    name: 'Shadowfax',
    brand: 'Tesla',
    model: 'Model Y',
    fuelType: 'Electric'
  }
};

// Website organization JSON-LD
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'A Whittle Wandering',
  alternateName: 'AWW',
  url: 'https://www.awhittlewandering.com',
  description: 'Track your electric vehicle adventures across the world. Interactive maps, real-time analytics, and journey sharing.',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  featureList: [
    'Interactive journey maps',
    'Real-time vehicle tracking',
    'Energy consumption analytics',
    'Route playback',
    'Photo gallery',
    'Journey sharing'
  ]
};

// Breadcrumb JSON-LD generator
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
