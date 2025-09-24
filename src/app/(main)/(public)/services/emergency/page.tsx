// app/(main)/(public)/services/emergency/page.tsx
import {
  Home,
  ToolCase,
  AlertTriangle,
  Clock,
  Shield,
  Phone,
} from "lucide-react";
import Link from "next/link";

// Optional: Add metadata for SEO
export const metadata = {
  title: "Emergency Services - Coming Soon",
  description:
    "Emergency services feature is currently under development. Get instant access to urgent service providers when it's ready.",
};

export default function EmergencyServicesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 bg-white dark:bg-gray-900 transition-colors">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2">
            <Home size={14} />
            Home
          </Link>
          <span>/</span>
          <Link
            href="/services"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2">
            <ToolCase size={14} />
            Services
          </Link>
          <span>/</span>
          <span className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2">
            <AlertTriangle size={14} />
            Emergency
          </span>
        </nav>
      </div>

      <main className="min-h-[90vh] w-full">
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle
              size={28}
              className="text-red-600 dark:text-red-400"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Emergency Services
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Get instant access to urgent service providers when you need them
            most.
          </p>
        </section>

        {/* Not Available Yet Banner */}
        <section className="mb-12">
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-6 rounded-r-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                Feature Not Available Yet
              </h2>
            </div>
            <p className="text-amber-700 dark:text-amber-200">
              Our emergency services feature is currently under development.
              We&apos;re working hard to bring you instant access to urgent
              service providers. Check back soon!
            </p>
          </div>
        </section>

        {/* Preview of what's coming */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            What&apos;s Coming Soon
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Emergency Service Types Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-gray-800/25 p-6 bg-white dark:bg-gray-800 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-red-500 dark:text-red-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  24/7 Availability
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Round-the-clock access to emergency service providers for urgent
                situations.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-gray-800/25 p-6 bg-white dark:bg-gray-800 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <Phone size={24} className="text-red-500 dark:text-red-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Instant Connect
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Direct connection to verified emergency service providers in
                your area.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-gray-800/25 p-6 bg-white dark:bg-gray-800 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle
                  size={24}
                  className="text-red-500 dark:text-red-400"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Priority Support
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Prioritized handling for emergency requests with rapid response
                times.
              </p>
            </div>
          </div>
        </section>

        {/* Emergency Service Categories Preview */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Emergency Service Categories
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Home Emergencies
                </h4>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      Emergency Plumbing
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      Electrical Issues
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      Lockout Services
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Urgent Repairs
                </h4>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      HVAC Emergency
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      Security Systems
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    <span className="line-through opacity-60">
                      Emergency Cleaning
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-8 border border-red-200 dark:border-red-800">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Stay Tuned for Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
              We&apos;re working around the clock to bring you this essential
              feature. In the meantime, explore our regular services for all
              your non-emergency needs.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <ToolCase size={18} />
              Browse All Services
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
