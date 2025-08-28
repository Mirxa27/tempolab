import React from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { MapContainer as RLMapContainer, TileLayer as RLTileLayer, Marker as RLMarker, Popup as RLPopup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const ContactPage = () => {
  const contactInfo = [
    {
      title: "Phone",
      value: "+966 12 345 6789",
      icon: Phone,
    },
    {
      title: "Email",
      value: "support@habibstay.com",
      icon: Mail,
    },
    {
      title: "Address",
      value: "Riyadh, Saudi Arabia",
      icon: MapPin,
    },
    {
      title: "Chat",
      value: "Chat with Sara AI",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600">
              We're here to help. Reach out to us through any of these channels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {contactInfo.map((info) => (
                  <Card key={info.title}>
                    <CardContent className="p-6">
                      <info.icon className="w-6 h-6 text-primary mb-4" />
                      <h3 className="font-semibold mb-2">{info.title}</h3>
                      <p className="text-gray-600">{info.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          First Name
                        </label>
                        <Input placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="How can we help you?"
                        className="min-h-[120px]"
                      />
                    </div>
                    <Button className="w-full">Send Message</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="h-full">
              <Card className="h-full">
                <CardContent className="p-6 h-full">
                  <div className="aspect-square w-full rounded-lg mb-6 overflow-hidden">
                    // @ts-expect-error react-leaflet typings
                    <RLMapContainer center={[24.7136, 46.6753]} zoom={12} style={{ height: "100%", width: "100%", minHeight: 300 }}>
                      <RLTileLayer
                        // @ts-ignore react-leaflet typing mismatch workaround
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <RLMarker position={[24.7136, 46.6753]}>
                        <RLPopup>
                          HabibStay Office<br />Riyadh, Saudi Arabia
                        </RLPopup>
                      </RLMarker>
                    </RLMapContainer>
                  </div>
                  <h3 className="font-semibold mb-2">Office Location</h3>
                  <p className="text-gray-600">
                    123 Business District
                    <br />
                    Riyadh, Saudi Arabia
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;
