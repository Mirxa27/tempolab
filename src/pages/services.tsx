import React from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, Users, Search } from "lucide-react";

const ServicesPage = () => {
  const services = [
    {
      title: "Property Rental",
      description:
        "Find your perfect stay with our extensive selection of properties, from luxury villas to modern apartments.",
      icon: Building2,
      features: [
        "Instant booking",
        "Flexible durations",
        "Verified properties",
        "24/7 support",
      ],
    },
    {
      title: "Property Investment",
      description:
        "Invest in premium properties with attractive returns and professional management.",
      icon: TrendingUp,
      features: [
        "Curated opportunities",
        "Transparent returns",
        "Professional management",
        "Regular reporting",
      ],
    },
    {
      title: "Host Services",
      description:
        "List your property and reach thousands of potential guests and investors.",
      icon: Users,
      features: [
        "Professional photography",
        "Price optimization",
        "Booking management",
        "Marketing support",
      ],
    },
    {
      title: "AI-Powered Search",
      description:
        "Let Sara, our AI assistant, help you find the perfect property based on your preferences.",
      icon: Search,
      features: [
        "Personalized recommendations",
        "Bilingual support",
        "Smart filtering",
        "Real-time assistance",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover how HabibStay can help you find, rent, or invest in
            properties across Saudi Arabia.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => (
              <Card key={service.title} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-3">Features:</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ServicesPage;
