import React from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Properties</h2>
              <p className="text-gray-600">Manage property listings, pricing and amenities.</p>
              <Button onClick={() => navigate("/admin/properties")}>Manage</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Configuration</h2>
              <p className="text-gray-600">Site configuration and feature flags.</p>
              <Button onClick={() => navigate("/admin/config")}>Open</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Users & Roles</h2>
              <p className="text-gray-600">Assign roles and manage permissions.</p>
              <Button onClick={() => navigate("/admin/users")}>Manage</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminHome;

