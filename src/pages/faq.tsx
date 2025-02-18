import React from "react";
import Header from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQPage = () => {
  const faqs = [
    {
      category: "Booking & Stays",
      questions: [
        {
          q: "How do I book a property?",
          a: "You can book a property through our website by searching for your desired location and dates, selecting a property, and completing the booking process. You can also use Sara AI Assistant for personalized recommendations.",
        },
        {
          q: "What payment methods are accepted?",
          a: "We accept various payment methods including credit cards, PayPal, and MyFatoorah. All payments are processed securely through our platform.",
        },
        {
          q: "What is the cancellation policy?",
          a: "Cancellation policies vary by property and booking duration. The specific policy will be clearly displayed before you complete your booking.",
        },
      ],
    },
    {
      category: "Property Investment",
      questions: [
        {
          q: "How can I invest in properties?",
          a: "You can invest in properties through our platform by browsing available investment opportunities, selecting your preferred property, and completing the investment process.",
        },
        {
          q: "What are the minimum investment amounts?",
          a: "Minimum investment amounts vary by property but typically start from SAR 50,000. Each investment opportunity clearly states its minimum investment requirement.",
        },
        {
          q: "How are returns calculated and distributed?",
          a: "Returns are calculated based on the property's performance and your investment share. Distributions are made quarterly through our secure payment system.",
        },
      ],
    },
    {
      category: "For Property Owners",
      questions: [
        {
          q: "How do I list my property?",
          a: "You can list your property by creating an account, providing property details and photos, and submitting for verification. Our team will review and approve your listing within 24-48 hours.",
        },
        {
          q: "What are the fees for listing?",
          a: "We charge a competitive commission on successful bookings. There are no upfront fees for listing your property.",
        },
        {
          q: "How do you handle property management?",
          a: "We offer optional property management services including cleaning, maintenance, and guest support. You can choose the level of service that suits your needs.",
        },
      ],
    },
    {
      category: "Sara AI Assistant",
      questions: [
        {
          q: "What is Sara AI Assistant?",
          a: "Sara is our bilingual AI assistant that helps users find properties, make bookings, and get support in both Arabic and English.",
        },
        {
          q: "How accurate are Sara's recommendations?",
          a: "Sara uses advanced AI algorithms to analyze your preferences and provide personalized recommendations based on your specific needs and requirements.",
        },
        {
          q: "Can Sara help with bookings?",
          a: "Yes, Sara can guide you through the entire booking process, from finding properties to completing your reservation.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <h1 className="text-4xl font-bold mb-8">
            Frequently Asked Questions
          </h1>

          <div className="space-y-8">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-semibold mb-4">
                  {section.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${section.category}-${index}`}
                    >
                      <AccordionTrigger className="text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent>{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQPage;
