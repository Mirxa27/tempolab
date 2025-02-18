import React from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, PieChart, Building2 } from "lucide-react";

const ForInvestorsPage = () => {
  const benefits = [
    {
      title: "High Returns",
      description:
        "Access investment opportunities with expected returns of 15-20% annually.",
      icon: TrendingUp,
    },
    {
      title: "Secure Investment",
      description:
        "All properties are thoroughly vetted and managed by professionals.",
      icon: Shield,
    },
    {
      title: "Transparent Reporting",
      description:
        "Regular updates and detailed performance reports for your investments.",
      icon: PieChart,
    },
    {
      title: "Diverse Portfolio",
      description:
        "Invest in a variety of properties across different locations and types.",
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Invest in Properties</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start building your real estate portfolio with HabibStay's curated
              investment opportunities.
            </p>
            <Button size="lg" className="mt-6">
              Start Investing
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="p-6">
                  <benefit.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">Investment Process</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-lg font-semibold">Browse Opportunities</h3>
                <p className="text-gray-600">
                  Explore our selection of vetted investment properties.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-lg font-semibold">
                  Choose Your Investment
                </h3>
                <p className="text-gray-600">
                  Select properties that match your investment goals.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-lg font-semibold">Secure Payment</h3>
                <p className="text-gray-600">
                  Make your investment through our secure payment system.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  4
                </div>
                <h3 className="text-lg font-semibold">Track Performance</h3>
                <p className="text-gray-600">
                  Monitor your investment's performance and receive returns.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForInvestorsPage;
