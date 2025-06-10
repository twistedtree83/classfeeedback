import React from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  BarChart3,
  FileText,
  Users,
  Shield,
  Sparkles,
  Zap,
  Brain,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { LogoWrapper } from "@/components/LogoWrapper";
import { HeroCard } from "@/components/ui/HeroCard";

export function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Feedback",
      description:
        "Get instant feedback from students during your lessons to gauge understanding and adjust your teaching on the fly.",
      color: "deep-sky-blue",
      gradient: "from-deep-sky-blue/10 to-deep-sky-blue/5",
    },
    {
      icon: Brain,
      title: "AI-Powered Lesson Planning",
      description:
        "Upload your lesson plans and let our AI help organize, structure, and enhance them with intelligent teaching cards.",
      color: "harvest-gold",
      gradient: "from-harvest-gold/10 to-harvest-gold/5",
    },
    {
      icon: Users,
      title: "Student Engagement",
      description:
        "Keep students engaged with interactive sessions, real-time messaging, and differentiated content that adapts to learning needs.",
      color: "sea-green",
      gradient: "from-sea-green/10 to-sea-green/5",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Create a Session",
      description:
        "Generate a unique 6-digit class code for your students to join your teaching session instantly.",
      icon: Zap,
    },
    {
      number: "2",
      title: "Students Join",
      description:
        "Students enter the class code to join your session from any device with a web browser - no app required.",
      icon: Users,
    },
    {
      number: "3",
      title: "Receive Feedback",
      description:
        "Monitor student understanding and questions in real-time throughout your lesson with live analytics.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white">
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5" />

        <div className="max-w-7xl mx-auto relative z-10">
          <HeroCard
            title="Real-time classroom feedback and engagement"
            subtitle="Interactive learning made simple"
            description="Help students learn better with instant feedback, interactive lessons, and AI-powered teaching tools. Create meaningful classroom interactions that improve learning outcomes."
            image="https://images.pexels.com/photos/8471799/pexels-photo-8471799.jpeg?auto=compress&cs=tinysrgb&w=1600"
            imageAlt="Classroom engagement"
            primaryButtonText={user ? "Go to Dashboard" : "Get Started"}
            secondaryButtonText={user ? "View Lessons" : "Join as Student"}
            primaryButtonLink={user ? "/dashboard" : "/signup"}
            secondaryButtonLink={user ? "/planner" : "/join"}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6 text-balance">
              Everything you need for
              <br />
              <span className="gradient-text">modern education</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Transform your classroom with cutting-edge tools designed for
              today's educators and students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`modern-card hover-lift p-8 bg-gradient-to-br ${feature.gradient} group cursor-pointer`}
                >
                  <div
                    className={`bg-${feature.color}/20 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-8 w-8 text-${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-dark-purple group-hover:text-dark-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-dark-purple/5 via-deep-sky-blue/5 to-harvest-gold/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-sea-green/10 to-bice-blue/10 rounded-full filter blur-3xl animate-pulse-soft" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-bice-blue bg-bice-blue/10 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              Simple Setup
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6 text-balance">
              Get started in
              <br />
              <span className="gradient-text">3 easy steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="relative mb-8">
                    <div className="glass backdrop-blur-md h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 border border-white/30">
                      <span className="text-3xl font-bold gradient-text">
                        {step.number}
                      </span>
                    </div>
                    <Icon className="h-8 w-8 text-harvest-gold mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-dark-purple">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="modern-card p-12 md:p-16 text-center bg-gradient-to-br from-dark-purple via-dark-purple-300 to-dark-purple text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-deep-sky-blue/20 via-transparent to-harvest-gold/20" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-white/10 to-transparent rounded-full filter blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                Trusted by educators worldwide
              </h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto text-balance">
                Join thousands of teachers who are transforming their classrooms
                with our platform.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-harvest-gold mb-2">
                    1000+
                  </div>
                  <div className="text-white/80">Active Teachers</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-deep-sky-blue mb-2">
                    50K+
                  </div>
                  <div className="text-white/80">Students Engaged</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-sea-green mb-2">
                    100K+
                  </div>
                  <div className="text-white/80">Lessons Created</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    98%
                  </div>
                  <div className="text-white/80">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="modern-card p-12 md:p-16 text-center bg-gradient-to-br from-white via-slate-50/50 to-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-harvest-gold/10 via-transparent to-deep-sky-blue/10" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-l from-sea-green/20 to-transparent rounded-full filter blur-3xl animate-pulse-soft" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-dark-purple bg-dark-purple/10 px-4 py-2 rounded-full mb-6">
                <Heart className="h-4 w-4" />
                Ready to Transform?
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-dark-purple text-balance">
                Start creating better
                <br />
                <span className="gradient-text">learning experiences</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
                Join thousands of educators who are enhancing student engagement
                and improving learning outcomes with our platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/dashboard">
                    <Button
                      size="xl"
                      variant="gradient"
                      className="group shadow-glow-blue"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup">
                      <Button
                        size="xl"
                        variant="gradient"
                        className="group shadow-glow-blue"
                      >
                        Create Free Account
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link to="/join">
                      <Button
                        variant="glass"
                        size="xl"
                        className="border-dark-purple/20 text-dark-purple hover:bg-dark-purple/5"
                      >
                        Join as Student
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-dark-purple via-dark-purple-300 to-dark-purple text-white py-16 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep-sky-blue/10 via-transparent to-harvest-gold/10" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center mb-8 md:mb-0">
              <LogoWrapper size="lg" variant="full" className="text-white" />
            </div>
            <div className="flex flex-wrap gap-8 justify-center md:justify-end">
              <a
                href="#"
                className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white"
              >
                About
              </a>
              <a
                href="#"
                className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white"
              >
                Features
              </a>
              <a
                href="#"
                className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white"
              >
                Pricing
              </a>
              <a
                href="#"
                className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white"
              >
                Contact
              </a>
              <a
                href="#"
                className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white"
              >
                Support
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center text-white/60">
            <p>
              &copy; 2025 ClassFeedback. All rights reserved. Built with ❤️ for
              educators worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
