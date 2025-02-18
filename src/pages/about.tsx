import React from "react";
import Header from "@/components/Header";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <h1 className="text-4xl font-bold mb-8">About HabibStay</h1>
          <div className="prose max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              HabibStay is Saudi Arabia's premier property marketplace, offering
              a unique blend of traditional hospitality and modern convenience.
              Our platform connects property owners with guests and investors,
              creating opportunities for everyone to participate in the
              Kingdom's growing real estate market.
            </p>
            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Our Mission</h2>
                <p className="text-gray-600">
                  To revolutionize property rental and investment in Saudi
                  Arabia by providing a seamless, trustworthy platform that
                  respects local values while embracing innovation.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Our Vision</h2>
                <p className="text-gray-600">
                  To become the leading property marketplace in the Middle East,
                  known for our commitment to excellence, innovation, and
                  customer satisfaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold mb-8">Why Choose HabibStay?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Trusted Platform</h3>
              <p className="text-gray-600">
                Verified properties and hosts, secure payments, and 24/7
                customer support.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Investment Opportunities
              </h3>
              <p className="text-gray-600">
                Unique opportunities to invest in premium properties with
                attractive returns.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">AI-Powered Experience</h3>
              <p className="text-gray-600">
                Sara, our AI assistant, provides personalized recommendations
                and support in both Arabic and English.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
