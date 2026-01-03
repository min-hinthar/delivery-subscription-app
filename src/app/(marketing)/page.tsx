import Link from "next/link";
import { ArrowRight, MapPin, Star, Clock, Package, Shield, CheckCircle2, Quote } from "lucide-react";

import { ButtonV2 } from "@/components/ui/button-v2";
import { CoverageChecker } from "@/components/marketing/coverage-checker";
import { WeeklyMenu } from "@/components/marketing/weekly-menu";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-24">
      {/* Hero Section - Burmese-inspired gradient background */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D4A574] via-[#C19663] to-[#8B4513] px-6 py-16 text-white shadow-2xl sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        {/* Decorative overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/burmese-pattern.svg')] opacity-10" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Mandalay Morning Star Delivery
                </p>
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Authentic Burmese Cuisine Delivered Fresh Every Weekend
                </h1>
                <p className="text-lg text-white/90 sm:text-xl">
                  Subscribe once and enjoy chef-curated Burmese meals delivered to your door. Choose your Saturday or Sunday delivery window and track your driver in real-time.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href="#coverage">
                  <ButtonV2
                    size="lg"
                    className="bg-white text-[#8B4513] hover:bg-white/90 focus-visible:ring-white"
                  >
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    Check Coverage
                  </ButtonV2>
                </Link>
                <Link href="/pricing">
                  <ButtonV2
                    size="lg"
                    variant="outline"
                    className="border-2 border-white bg-transparent text-white hover:bg-white/10"
                  >
                    View Plans
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </ButtonV2>
                </Link>
              </div>

              {/* Delivery Windows */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span>Sat 11:00–19:00 PT</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span>Sun 11:00–15:00 PT</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
                  <Package className="h-4 w-4" />
                  <span>Cutoff: Fri 5:00 PM</span>
                </div>
              </div>
            </div>

            {/* Right Column - Featured Dish Placeholder */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl bg-white/10 shadow-2xl backdrop-blur-sm lg:aspect-[4/5]">
                {/* Placeholder for food image */}
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5">
                  <div className="space-y-4 text-center">
                    <Package className="mx-auto h-24 w-24 text-white/60" />
                    <p className="text-sm text-white/80">
                      Hero Image: Featured Burmese Dish
                      <br />
                      <span className="text-xs">(800x1000px, WebP format)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 left-6 right-6 rounded-xl bg-white p-6 shadow-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#D4A574]">1000+</div>
                    <div className="text-xs text-gray-600">Happy Customers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D4A574]">4.9★</div>
                    <div className="text-xs text-gray-600">Average Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D4A574]">20+</div>
                    <div className="text-xs text-gray-600">Weekly Dishes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Value Propositions */}
      <section className="mx-auto max-w-7xl space-y-12">
        <div className="space-y-4 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
            Why Mandalay Morning Star?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Experience the perfect blend of authentic Burmese flavors, modern convenience, and reliable service.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Star,
              title: "Authentic Recipes",
              description: "Traditional Burmese dishes prepared by experienced chefs using time-honored techniques.",
              color: "text-[#D4A574]",
            },
            {
              icon: Clock,
              title: "Flexible Scheduling",
              description: "Choose your preferred delivery window and manage your schedule with ease.",
              color: "text-[#DC143C]",
            },
            {
              icon: MapPin,
              title: "Real-Time Tracking",
              description: "Track your driver's location and get accurate ETA updates throughout delivery.",
              color: "text-[#8B4513]",
            },
            {
              icon: Shield,
              title: "Quality Guaranteed",
              description: "Fresh ingredients, careful preparation, and temperature-controlled delivery.",
              color: "text-[#D4A574]",
            },
          ].map((feature) => (
            <Card key={feature.title} className="group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#D4A574]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative space-y-4">
                <div className={`inline-flex rounded-xl bg-gray-100 p-3 dark:bg-gray-800 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Coverage Checker Section */}
      <section id="coverage" className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl dark:from-gray-900 dark:to-gray-800 sm:p-12">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Check Delivery Coverage
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Enter your ZIP code to confirm delivery eligibility, estimated drive time, and distance from our kitchen.
                </p>
              </div>
              <CoverageChecker />
            </div>

            <Card className="relative overflow-hidden border-2 border-[#D4A574]/20 bg-white p-6 dark:bg-gray-900">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-transparent" />
              <div className="relative space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Coverage Details
                </h3>
                <ul className="space-y-3">
                  {[
                    "ZIP code county eligibility verification",
                    "Real-time Google Maps ETA calculations",
                    "Expansion waitlist for out-of-range areas",
                    "Delivery radius updates every quarter",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D4A574]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border-2 border-dashed border-[#D4A574]/30 bg-[#D4A574]/5 p-4">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    <strong>Need help?</strong> Email support@morningstardelivery.com and we'll verify coverage for you.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Weekly Menu Section */}
      <WeeklyMenu />

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-7xl space-y-12">
        <div className="space-y-4 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Get started in three simple steps—from choosing your plan to enjoying your first delivery.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Choose Your Plan",
              description: "Subscribe to lock in your weekly delivery windows and preferred schedule.",
              image: "plan-selection",
            },
            {
              step: "02",
              title: "Complete Onboarding",
              description: "Set up your profile, delivery address, and dietary preferences in minutes.",
              image: "onboarding",
            },
            {
              step: "03",
              title: "Schedule & Track",
              description: "Pick your delivery window and follow your driver in real-time on delivery day.",
              image: "tracking",
            },
          ].map((item, index) => (
            <Card key={item.title} className="relative overflow-hidden p-8">
              <div className="absolute right-4 top-4 font-display text-6xl font-bold text-[#D4A574]/10">
                {item.step}
              </div>
              <div className="relative space-y-4">
                {/* Image placeholder */}
                <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-[#D4A574]/10 to-[#8B4513]/10">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Package className="mx-auto h-12 w-12 text-[#D4A574]/40" />
                      <p className="mt-2 text-xs text-gray-500">
                        {item.image}
                        <br />
                        (600x400px)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
              {/* Connector line for desktop */}
              {index < 2 && (
                <div className="absolute -right-4 top-1/2 hidden h-0.5 w-8 bg-gradient-to-r from-[#D4A574] to-transparent md:block" />
              )}
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link href="/pricing">
            <ButtonV2 size="lg">
              View Pricing Plans
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </ButtonV2>
          </Link>
          <Link href="/signup">
            <ButtonV2 size="lg" variant="outline">
              Start Your Subscription
            </ButtonV2>
          </Link>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#8B4513] to-[#D4A574] px-6 py-16 text-white sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/burmese-pattern.svg')] opacity-10" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-12">
          <div className="space-y-4 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/90">
              Join hundreds of satisfied customers who enjoy authentic Burmese cuisine every week.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Sarah Chen",
                role: "San Francisco, CA",
                quote: "The mohinga is absolutely authentic! Reminds me of my trips to Yangon. The real-time tracking is a game-changer.",
                rating: 5,
              },
              {
                name: "Michael Rodriguez",
                role: "Oakland, CA",
                quote: "I love the flexibility of choosing my delivery window. The food arrives fresh and perfectly packaged every time.",
                rating: 5,
              },
              {
                name: "Priya Patel",
                role: "Berkeley, CA",
                quote: "Finally, authentic Burmese food delivered to my door! The tea leaf salad and coconut noodles are my weekly favorites.",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="relative overflow-hidden bg-white/10 p-6 backdrop-blur-sm">
                <Quote className="absolute right-4 top-4 h-12 w-12 text-white/20" aria-hidden="true" />
                <div className="relative space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#D4A574] text-[#D4A574]" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-white/90">"{testimonial.quote}"</p>
                  <div className="border-t border-white/20 pt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-white/70">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-8 text-center">
            <Link href="/signup">
              <ButtonV2
                size="lg"
                className="bg-white text-[#8B4513] hover:bg-white/90 focus-visible:ring-white"
              >
                Join Our Community
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </ButtonV2>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl text-center">
        <Card className="overflow-hidden border-2 border-[#D4A574]/20 bg-gradient-to-br from-[#D4A574]/5 to-white p-12 dark:to-gray-900">
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Ready to Experience Authentic Burmese Cuisine?
            </h2>
            <p className="mx-auto max-w-xl text-lg text-gray-600 dark:text-gray-400">
              Subscribe today and get your first delivery scheduled. Flexible plans, authentic flavors, and reliable service.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/pricing">
                <ButtonV2 size="lg">
                  View All Plans
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </ButtonV2>
              </Link>
              <Link href="/signup">
                <ButtonV2 size="lg" variant="secondary">
                  Create Account
                </ButtonV2>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Questions? Email{" "}
              <a href="mailto:support@morningstardelivery.com" className="font-medium text-[#8B4513] hover:underline">
                support@morningstardelivery.com
              </a>
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
