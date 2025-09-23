"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Shield,
  Users,
  ArrowRight,
  Package,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Eye,
  CreditCard,
  Award,
  TrendingUp,
  ChevronRight,
  Play,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Types
interface Service {
  name: string;
  icon: React.ReactNode;
  description: string;
  avgPrice: string;
}

interface SafetyFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ErrandsMate: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  const services: Service[] = [
    {
      name: "Grocery Shopping",
      icon: (
        <ShoppingCart className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      ),
      description: "Fresh groceries delivered from your favorite stores",
      avgPrice: "from ₵15",
    },
    {
      name: "Package Delivery",
      icon: <Package className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      description: "Same-day delivery across the city",
      avgPrice: "from ₵10",
    },
    {
      name: "House Cleaning",
      icon: <Home className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      description: "Professional cleaning services",
      avgPrice: "from ₵50",
    },
    {
      name: "Food Delivery",
      icon: <Utensils className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      description: "Hot meals from local restaurants",
      avgPrice: "from ₵8",
    },
    {
      name: "Transportation",
      icon: <Car className="w-12 h-12 text-blue-600 dark:text-blue-400" />,
      description: "Reliable rides when you need them",
      avgPrice: "from ₵12",
    },
  ];

  const safetyFeatures: SafetyFeature[] = [
    {
      title: "Background-Checked Taskers",
      description:
        "Every tasker goes through identity verification and background screening",
      icon: <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Insurance Coverage",
      description:
        "All tasks are covered by comprehensive insurance protection",
      icon: <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Real-Time Tracking",
      description: "Track your tasker's location and progress in real-time",
      icon: <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Secure Payments",
      description:
        "Safe, encrypted transactions with automatic payment processing",
      icon: <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
  ];

  const steps: Step[] = [
    {
      number: 1,
      title: "Request an Errand",
      description: "Tell us what you need and when you need it done",
      icon: <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      number: 2,
      title: "Choose a Tasker",
      description: "Browse verified taskers and select the best fit",
      icon: <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      number: 3,
      title: "Track Progress",
      description: "Follow your tasker's progress with real-time updates",
      icon: <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
    {
      number: 4,
      title: "Complete & Rate",
      description: "Get your task completed and rate the experience",
      icon: <Star className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    },
  ];

  // Auto-rotate services
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [services.length]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <section className="p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ghana&apos;s #1 Errand App
                </Badge>

                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  Your Errands,{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Simplified
                  </span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Connect with trusted, background-checked taskers who handle
                  your to-do list so you can focus on what matters most.
                </p>
              </div>

              {/* Search Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="What do you need help with?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Your location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-12 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <Button className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800">
                    Find Taskers
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    1,200+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Verified Taskers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    15K+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Tasks Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    4.9
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Average Rating
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Service Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentServiceIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="p-8 bg-white dark:bg-gray-800 shadow-2xl border-0">
                      <CardContent className="p-0 text-center space-y-6">
                        <div className="text-blue-600 dark:text-blue-400">
                          {services[currentServiceIndex].icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {services[currentServiceIndex].name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {services[currentServiceIndex].description}
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          >
                            {services[currentServiceIndex].avgPrice}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Service Indicators */}
                <div className="flex justify-center mt-6 space-x-2">
                  {services.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentServiceIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentServiceIndex
                          ? "bg-blue-600 dark:bg-blue-400"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-800/20 dark:to-purple-800/20 rounded-3xl transform rotate-6 scale-105" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              From everyday tasks to special projects
            </p>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                  <CardContent className="p-0 text-center space-y-4">
                    <div className="text-blue-600 dark:text-blue-400">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {service.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700 dark:border-green-600 dark:text-green-200"
                    >
                      {service.avgPrice}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Safety & Security First
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your peace of mind is our priority
            </p>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {safetyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 text-center h-full border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0 space-y-4">
                    <div className="text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get your tasks done in 4 simple steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600 transform -translate-y-1/2">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
              />
            </div>

            <motion.div
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full border-4 border-blue-600 dark:border-blue-400 flex items-center justify-center mx-auto shadow-lg">
                      <div className="text-blue-600 dark:text-blue-400">
                        {step.icon}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>

                    {/* Arrow */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-9 -right-8 text-gray-400 dark:text-gray-500">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 dark:text-blue-200 mb-12 max-w-3xl mx-auto">
              Join thousands of satisfied customers who trust ErrandsMate with
              their daily tasks
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-4 text-lg"
              >
                Find Taskers Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white dark:border-gray-300 text-white dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-300 px-8 py-4 text-lg"
              >
                Become a Tasker
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Button
                variant="outline"
                className="border-white dark:border-gray-300 text-white dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Download for iOS
              </Button>
              <Button
                variant="outline"
                className="border-white dark:border-gray-300 text-white dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Download for Android
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-800 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold mb-4 text-white dark:text-gray-100">
                Company
              </h3>
              <div className="space-y-3 text-gray-400 dark:text-gray-300">
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Careers
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Press
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white dark:text-gray-100">
                Support
              </h3>
              <div className="space-y-3 text-gray-400 dark:text-gray-300">
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Help Center
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Safety
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white dark:text-gray-100">
                Taskers
              </h3>
              <div className="space-y-3 text-gray-400 dark:text-gray-300">
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Become a Tasker
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Tasker Resources
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Requirements
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white dark:text-gray-100">
                Legal
              </h3>
              <div className="space-y-3 text-gray-400 dark:text-gray-300">
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="block hover:text-white dark:hover:text-gray-100 transition-colors"
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-600 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white dark:text-gray-100 font-bold">
                  E
                </span>
              </div>
              <span className="text-xl font-bold text-white dark:text-gray-100">
                ErrandsMate
              </span>
            </div>
            <p className="text-gray-400 dark:text-gray-300 text-center">
              © 2024 ErrandsMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ErrandsMate;
