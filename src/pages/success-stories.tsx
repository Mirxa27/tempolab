import React from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";

const SuccessStoriesPage = () => {
  const stories = [
    {
      id: 1,
      name: "Abdullah Al-Rashid",
      role: "Property Owner",
      location: "Riyadh",
      story:
        "Since joining HabibStay, my property's occupancy rate has increased by 40%. The AI-driven pricing and professional management have transformed my investment.",
      metrics: {
        occupancyIncrease: "40%",
        revenueGrowth: "55%",
        monthsWithPlatform: 12,
      },
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah",
    },
    {
      id: 2,
      name: "Fatima Al-Saud",
      role: "Investor",
      location: "Jeddah",
      story:
        "I've invested in three properties through HabibStay, and the returns have exceeded my expectations. The transparency and professional management give me peace of mind.",
      metrics: {
        annualReturn: "18%",
        propertiesOwned: 3,
        totalInvestment: "$500,000",
      },
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
    },
    {
      id: 3,
      name: "Omar Al-Harbi",
      role: "Property Developer",
      location: "Dammam",
      story:
        "HabibStay's platform has revolutionized how we manage and market our properties. The AI-powered insights help us make data-driven decisions.",
      metrics: {
        propertiesListed: 15,
        averageRating: 4.9,
        bookingsIncrease: "75%",
      },
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how property owners, investors, and developers are
              achieving their goals with HabibStay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <Card key={story.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{story.name}</h3>
                      <p className="text-sm text-gray-500">{story.role}</p>
                      <p className="text-sm text-gray-500">{story.location}</p>
                    </div>
                  </div>

                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  <p className="text-gray-600 mb-6">{story.story}</p>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Key Achievements</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(story.metrics).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-gray-500">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg">Share Your Story</Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuccessStoriesPage;
