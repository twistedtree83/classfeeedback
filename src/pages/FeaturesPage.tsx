import React from 'react';
import { Link } from 'react-router-dom';
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
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogoWrapper } from '@/components/LogoWrapper';

export function FeaturesPage() {
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

  const benefits = [
    {
      icon: Zap,
      title: "Save Time",
      description: "Automate routine tasks and focus on what matters most - teaching and connecting with your students."
    },
    {
      icon: BellRing,
      title: "Instant Notifications",
      description: "Get real-time alerts when students need help or have questions during your lesson."
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "All student data is protected with enterprise-grade security and complies with educational privacy standards."
    },
    {
      icon: Heart,
      title: "Improve Learning Outcomes",
      description: "Personalize instruction based on real-time feedback to ensure every student succeeds."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <LogoWrapper size="md" />
            <span className="ml-2 font-semibold text-dark-purple">CoTeach</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/join">
              <Button variant="outline" size="sm">Join as Student</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6">
            Powerful Features for Modern Educators
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover how our platform transforms classroom interaction and enhances the teaching experience with innovative tools designed for today's educational environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/join">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as Student
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              Core Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              Everything you need for
              <br />
              <span className="gradient-text">effective teaching</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines real-time feedback, AI-powered tools, and student engagement features to create a seamless teaching experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`modern-card hover-lift p-8 bg-gradient-to-br ${feature.gradient} group`}
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

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
              <Heart className="h-4 w-4" />
              Benefits
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              Why Educators Love Our Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of teachers who are transforming their classrooms with our innovative tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="modern-card p-6 hover-lift text-center">
                  <div className="bg-gradient-to-br from-deep-sky-blue/20 to-harvest-gold/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-dark-purple" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-dark-purple">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-dark-purple/10 via-transparent to-harvest-gold/10">
        <div className="container mx-auto max-w-4xl">
          <div className="modern-card p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              Ready to Transform Your Classroom?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of educators who are enhancing student engagement and improving learning outcomes with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-purple text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-6 md:mb-0">
              <LogoWrapper size="md" />
              <span className="ml-2 font-semibold">CoTeach</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link to="/" className="text-white/80 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-white/80 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/about" className="text-white/80 hover:text-white transition-colors">
                About
              </Link>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Contact
              </a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">
                Privacy
              </a>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-white/60">
            <p>
              &copy; 2025 CoTeach. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}