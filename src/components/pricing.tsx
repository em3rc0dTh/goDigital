import CheckoutButton from "@/components/CheckoutButton";
import SEO from "@/utils/seo";
import { useI18n } from "@/i18n/I18nProvider";

export default function PricingPage() {
  const { t } = useI18n();
  const plans = [
    {
      name: t("Components.Pricing.basic"),
      price: "$9.99/month",
      features: [t("Components.Pricing.features.f1"), t("Components.Pricing.features.f2")],
      priceId: "price_1234",
    },
    {
      name: t("Components.Pricing.pro"),
      price: "$19.99/month",
      features: [t("Components.Pricing.features.f1"), t("Components.Pricing.features.f2"), t("Components.Pricing.features.f3")],
      priceId: "price_5678",
    },
  ];

  return (
    <>
      <SEO
        title="My SaaS Boilerplate"
        description="A Next.js TypeScript Prcing page."
        canonicalUrl="https://yourdomain.com"
        ogImageUrl="https://yourdomain.com/og-image.png"
        twitterHandle="yourtwitterhandle"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {t("Components.Pricing.title")}
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
              <p className="text-xl mb-4">{plan.price}</p>
              <ul className="mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="mb-2">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <CheckoutButton priceId={plan.priceId} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
