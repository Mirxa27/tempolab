import React from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calendar, MessageCircle, Shield } from "lucide-react";
import AISearchToggle from "@/components/AISearchToggle";

const ForGuestsPage = () => {
  const features = [
    {
      title: "Smart Search",
      description:
        "Find your perfect stay with our AI-powered search and filtering system.",
      icon: Search,
    },
    {
      title: "Instant Booking",
      description:
        "Book your stay instantly with our secure and easy-to-use platform.",
      icon: Calendar,
    },
    {
      title: "24/7 Support",
      description:
        "Get help anytime with Sara AI Assistant and our customer support team.",
      icon: MessageCircle,
    },
    {
      title: "Secure Stays",
      description:
        "All properties are verified and backed by our satisfaction guarantee.",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Discover comfortable and luxurious properties across Saudi Arabia,
              with the help of Sara AI Assistant.
            </p>
            <div className="max-w-xl mx-auto">
              <AISearchToggle />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">How to Book</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-lg font-semibold">Search & Filter</h3>
                <p className="text-gray-600">
                  Use our smart search to find properties that match your needs.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-lg font-semibold">Choose & Book</h3>
                <p className="text-gray-600">
                  Select your perfect property and book instantly.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-lg font-semibold">Enjoy Your Stay</h3>
                <p className="text-gray-600">
                  Get instant confirmation and enjoy your comfortable stay.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg">Start Your Search</Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForGuestsPage;
