"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Service } from "@/types/service.types";
import { Loader } from "lucide-react";
import { toast } from "react-hot-toast";

const ServiceList: React.FC = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
        <button
          onClick={() => router.push("/services/create")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create New Service
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader className="animate-spin mx-auto mb-4" size={40} />
          <p>Loading services...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service._id.toString()}
              className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600 mb-4">
                {service.description.slice(0, 100)}...
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/services/${service._id}`)}
                  className="px-3 py-1 text-blue-600 hover:text-blue-800">
                  View
                </button>
                <button
                  onClick={() => router.push(`/services/${service._id}/edit`)}
                  className="px-3 py-1 text-green-600 hover:text-green-800">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;
