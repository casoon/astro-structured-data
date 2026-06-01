// @ts-check
import { defineConfig } from 'astro/config';
import structuredData from 'astro-structured-data';

// https://astro.build/config
export default defineConfig({
  integrations: [
    structuredData({
      siteUrl: 'https://example.com',
      useGraph: true,
      defaultLocalBusiness: {
        name: 'Astro Demo Store',
        imageUrl: 'https://example.com/store.jpg',
        telephone: '+49 30 1234567',
        priceRange: '$$',
        address: {
          streetAddress: 'Hauptstraße 42',
          addressLocality: 'Berlin',
          postalCode: '10119',
          addressCountry: 'DE',
        },
        geo: {
          latitude: 52.5200,
          longitude: 13.4050,
        },
        openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-16:00'],
      },
      defaultArticlePublisher: {
        name: 'Astro Publishing Group',
        logo: {
          url: 'https://example.com/logo.png',
        },
      },
      defaultBrand: {
        name: 'Astro Labs Official',
      },
      defaultShippingDetails: {
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '4.95',
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'DE',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
      defaultReturnPolicy: {
        applicableCountry: 'DE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnPeriod',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    }),
  ],
});
