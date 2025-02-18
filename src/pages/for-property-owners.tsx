import React from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, Shield, BarChart } from "lucide-react";

const ForPropertyOwnersPage = () => {
  const benefits = [
    {
      title: "Maximum Exposure",
      description:
        "Reach thousands of potential guests and investors through our platform.",
      icon: Building2,
    },
    {
      title: "Optimal Returns",
      description:
        "Our dynamic pricing system ensures you get the best returns on your property.",
      icon: TrendingUp,
    },
    {
      title: "Secure Transactions",
      description:
        "All payments are processed securely through our trusted payment gateways.",
      icon: Shield,
    },
    {
      title: "Performance Analytics",
      description:
        "Track your property's performance with detailed analytics and insights.",
      icon: BarChart,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">List Your Property</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of property owners who trust HabibStay to manage
              their properties and maximize their returns.
            </p>
            <Button size="lg" className="mt-6">
              Get Started
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
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-lg font-semibold">List Your Property</h3>
                <p className="text-gray-600">
                  Create your listing with photos, amenities, and pricing
                  details.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-lg font-semibold">Get Verified</h3>
                <p className="text-gray-600">
                  Our team verifies your property to ensure quality standards.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-lg font-semibold">Start Earning</h3>
                <p className="text-gray-600">
                  Receive bookings and payments through our secure platform.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForPropertyOwnersPage;
