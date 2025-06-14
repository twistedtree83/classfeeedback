import React from 'react';
import { 
  MessageSquare, 
  BarChart3, 
  Users, 
  Sparkles, 
  Brain, 
  Zap, 
  Clock, 
  Link, 
  FileText, 
  Shield, 
  GraduationCap,
  Palette,
  Split,
  CheckCircle,
  ArrowRight,
  Bell
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LogoWrapper } from '@/components/LogoWrapper';
import { useAuth } from '@/contexts/AuthContext';

export function FeaturesPage() {
  const { user } = useAuth();
  
  const mainFeatures = [
    {
      title: "Real-time Student Feedback",
      description: "Collect instant feedback from students during your lessons to understand comprehension levels and adjust your teaching on the fly.",
      icon: MessageSquare,
      color: "deep-sky-blue",
      image: "https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "AI-Powered Lesson Planning",
      description: "Upload your lesson plans and let our AI analyze, structure, and enhance them with intelligent suggestions and organization.",
      icon: Brain,
      color: "harvest-gold",
      image: "https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      title: "Interactive Teaching Presentations",
      description: "Create dynamic teaching presentations that engage students and collect real-time feedback throughout your lesson.",
      icon: Sparkles,
      color: "sea-green",
      image: "https://images.pexels.com/photos/3826683/pexels-photo-3826683.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
  ];
  
  const teacherFeatures = [
    {
      title: "Live Analytics Dashboard",
      description: "Get real-time insights into student understanding with visual analytics and data visualization.",
      icon: BarChart3,
      color: "deep-sky-blue",
    },
    {
      title: "AI Activity Generation",
      description: "Generate engaging student activities and differentiated learning content with our AI tools.",
      icon: Sparkles,
      color: "sea-green",
    },
    {
      title: "Waiting Room Games",
      description: "Keep students engaged before class with educational games like our curriculum-aligned Wordle.",
      icon: GraduationCap,
      color: "harvest-gold",
    },
    {
      title: "Quick Session Creation",
      description: "Start a teaching session in seconds with a unique 6-digit code that students can easily join.",
      icon: Zap,
      color: "bice-blue",
    },
    {
      title: "Participant Management",
      description: "Approve students as they join your session to maintain control over your classroom.",
      icon: Users,
      color: "dark-purple",
    },
    {
      title: "Lesson Summaries",
      description: "Get comprehensive summaries of your teaching sessions, including student engagement metrics.",
      icon: FileText,
      color: "deep-sky-blue",
    },
  ];
  
  const studentFeatures = [
    {
      title: "Anonymous Feedback",
      description: "Students can express confusion or understanding without the pressure of raising their hand.",
      icon: MessageSquare,
      color: "deep-sky-blue",
    },
    {
      title: "Differentiated Content",
      description: "Content can be automatically adapted to different learning needs and abilities.",
      icon: Split,
      color: "sea-green",
    },
    {
      title: "Private Question Asking",
      description: "Students can ask questions privately that only the teacher can see and address.",
      icon: MessageSquare,
      color: "harvest-gold",
    },
    {
      title: "Simplified Material",
      description: "Complex content can be transformed into more accessible language with a single click.",
      icon: Palette,
      color: "bice-blue",
    },
    {
      title: "Teacher Messages",
      description: "Students receive notifications when teachers send important class-wide messages.",
      icon: Bell,
      color: "dark-purple",
    },
    {
      title: "Simple Join Process",
      description: "Join any class with just a 6-digit code - no accounts or complex setup required.",
      icon: Link,
      color: "deep-sky-blue",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            Platform Capabilities
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-dark-purple mb-6">
            Modern tools for <span className="gradient-text">modern teaching</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Discover all the powerful features that help teachers create more engaging lessons
            and students participate more actively in their learning journey.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <RouterLink to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Get Started Free"}
              </RouterLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#teachers">Teacher Features</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#students">Student Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              Core Capabilities
            </div>
            <h2 className="text-4xl font-bold text-dark-purple mb-6">
              Powerful features that transform your classroom
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform combines real-time feedback, AI assistance, and interactive 
              tools to create more engaging and effective learning experiences.
            </p>
          </div>
          
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className="flex flex-col md:flex-row items-center gap-12">
                  <div className={`md:w-1/2 ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/3]"
                    />
                  </div>
                  
                  <div className={`md:w-1/2 ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold text-${feature.color} bg-${feature.color}/10 px-4 py-2 rounded-full mb-6`}>
                      <Icon className="h-4 w-4" />
                      Featured Tool
                    </div>
                    
                    <h3 className="text-3xl font-bold text-dark-purple mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-lg text-muted-foreground mb-6">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className={`h-5 w-5 text-${feature.color} mt-0.5`} />
                        <p className="text-muted-foreground">
                          {index === 0 ? "Instantly see when students are confused or engaged" : 
                           index === 1 ? "Save hours of planning time with AI-powered assistance" : 
                           "Create interactive presentations with just a few clicks"}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className={`h-5 w-5 text-${feature.color} mt-0.5`} />
                        <p className="text-muted-foreground">
                          {index === 0 ? "Address confusion before it becomes a larger issue" : 
                           index === 1 ? "Generate activities, success criteria, and differentiated content" : 
                           "Seamlessly transition between teaching content and checking understanding"}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className={`h-5 w-5 text-${feature.color} mt-0.5`} />
                        <p className="text-muted-foreground">
                          {index === 0 ? "Track engagement patterns over time to improve your teaching" : 
                           index === 1 ? "Enhance your existing lesson plans with detailed AI expansion" : 
                           "Collect and analyze feedback in real-time during your lesson"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <Button variant={`${index === 0 ? 'default' : index === 1 ? 'accent' : 'success'}`} asChild>
                        <RouterLink to={user ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2">
                          <span>Try it Now</span>
                          <ArrowRight className="h-4 w-4" />
                        </RouterLink>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Teacher Features */}
      <section id="teachers" className="py-20 px-4 bg-gradient-to-r from-dark-purple/5 via-deep-sky-blue/5 to-harvest-gold/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-sea-green bg-sea-green/10 px-4 py-2 rounded-full mb-6">
              <GraduationCap className="h-4 w-4" />
              For Educators
            </div>
            
            <h2 className="text-4xl font-bold text-dark-purple mb-6">
              Tools designed specifically for teachers
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform helps teachers save time, gain insights, and create more 
              engaging learning experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teacherFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-soft hover:shadow-medium border border-white/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`bg-${feature.color}/10 p-4 rounded-2xl w-fit mb-6`}>
                    <Icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-purple mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <RouterLink to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Sign Up as Teacher"}
              </RouterLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Student Features */}
      <section id="students" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
              <Users className="h-4 w-4" />
              For Students
            </div>
            
            <h2 className="text-4xl font-bold text-dark-purple mb-6">
              Empowering every student to participate
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform helps students engage more deeply with lesson content and
              communicate their understanding more effectively.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studentFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-soft hover:shadow-medium border border-white/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`bg-${feature.color}/10 p-4 rounded-2xl w-fit mb-6`}>
                    <Icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-dark-purple mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" asChild>
              <RouterLink to="/join" className="inline-flex items-center gap-2">
                <span>Join as Student</span>
                <ArrowRight className="h-4 w-4" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 bg-gradient-to-r from-dark-purple/5 via-deep-sky-blue/5 to-harvest-gold/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
              <CheckCircle className="h-4 w-4" />
              Feature Comparison
            </div>
            
            <h2 className="text-4xl font-bold text-dark-purple mb-6">
              How we compare to other solutions
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform offers a comprehensive set of features designed specifically for 
              the modern classroom experience.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-soft border border-white/40">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-dark-purple font-bold border-b border-gray-100">Feature</th>
                  <th className="px-6 py-4 text-center text-dark-purple font-bold border-b border-gray-100">CoTeach</th>
                  <th className="px-6 py-4 text-center text-dark-purple font-bold border-b border-gray-100">Traditional Tools</th>
                  <th className="px-6 py-4 text-center text-dark-purple font-bold border-b border-gray-100">Other EdTech</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">Real-time student feedback</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ Advanced</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-amber-500">△ Basic</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">AI-powered lesson planning</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ Advanced</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">Differentiated content</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ Advanced</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-amber-500">△ Basic</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">Student engagement games</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ Integrated</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-amber-500">△ Limited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">Seamless student join process</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ 6-digit code</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-amber-500">△ Complex</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 border-b border-gray-100">Teaching session analytics</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-sea-green">✓ Real-time</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-red-500">✗</td>
                  <td className="px-6 py-4 text-center border-b border-gray-100 text-amber-500">△ Limited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">No student accounts required</td>
                  <td className="px-6 py-4 text-center text-sea-green">✓</td>
                  <td className="px-6 py-4 text-center text-sea-green">✓</td>
                  <td className="px-6 py-4 text-center text-red-500">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="modern-card p-12 md:p-16 text-center bg-gradient-to-br from-white via-slate-50/50 to-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-harvest-gold/10 via-transparent to-deep-sky-blue/10" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-l from-sea-green/20 to-transparent rounded-full filter blur-3xl animate-pulse-soft" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-dark-purple bg-dark-purple/10 px-4 py-2 rounded-full mb-6">
                <Zap className="h-4 w-4" />
                Ready to Get Started?
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-dark-purple text-balance">
                Transform your classroom with
                <br />
                <span className="gradient-text">powerful, interactive tools</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
                Join thousands of educators who are enhancing student engagement
                and improving learning outcomes with our platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <RouterLink to="/dashboard">
                    <Button
                      size="xl"
                      variant="gradient"
                      className="group shadow-glow-blue"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </RouterLink>
                ) : (
                  <>
                    <RouterLink to="/signup">
                      <Button
                        size="xl"
                        variant="gradient"
                        className="group shadow-glow-blue"
                      >
                        Create Free Account
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </RouterLink>
                    <RouterLink to="/join">
                      <Button
                        variant="glass"
                        size="xl"
                        className="border-dark-purple/20 text-dark-purple hover:bg-dark-purple/5"
                      >
                        Join as Student
                      </Button>
                    </RouterLink>
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
              <RouterLink to="/" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Home
              </RouterLink>
              <RouterLink to="/features" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Features
              </RouterLink>
              <RouterLink to="/about" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                About
              </RouterLink>
              <a href="#" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Pricing
              </a>
              <a href="#" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Contact
              </a>
              <a href="#" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
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

export default FeaturesPage;