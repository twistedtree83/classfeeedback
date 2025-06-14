import React from 'react';
import { 
  User, 
  Heart, 
  Lightbulb, 
  MessageSquare, 
  Target, 
  Zap, 
  Users,
  Mail,
  MapPin,
  Phone,
  GraduationCap,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LogoWrapper } from '@/components/LogoWrapper';

export function AboutPage() {
  const teamMembers = [
    {
      name: "Dr. Emma Chen",
      role: "Founder & CEO",
      bio: "Former high school teacher with 15 years of experience and a Ph.D. in Educational Technology.",
      image: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      name: "Marcus Johnson",
      role: "Chief Technology Officer",
      bio: "AI researcher and developer with a passion for applying technology to improve education.",
      image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      name: "Sophia Williams",
      role: "Head of Curriculum",
      bio: "Experienced curriculum designer who has worked with schools across the country to develop engaging content.",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Student-Centered",
      description: "We believe education should adapt to students, not the other way around."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We constantly push the boundaries of what educational technology can achieve."
    },
    {
      icon: MessageSquare,
      title: "Communication",
      description: "We foster better communication between teachers and students."
    },
    {
      icon: Target,
      title: "Inclusivity",
      description: "We design for all learners, regardless of ability or background."
    },
    {
      icon: Zap,
      title: "Efficiency",
      description: "We create tools that save teachers time so they can focus on teaching."
    },
    {
      icon: Users,
      title: "Community",
      description: "We build technology that strengthens educational communities."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
            <BookOpen className="h-4 w-4" />
            Our Story
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-dark-purple mb-6">
            Transforming education through <span className="gradient-text">real-time engagement</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            We're on a mission to create classrooms where every student feels heard, 
            understood, and empowered to succeed.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/features">Explore Our Features</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/join">Join as Student</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img 
                src="https://images.pexels.com/photos/3785653/pexels-photo-3785653.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Teacher with students" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
            
            <div className="md:w-1/2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
                <Lightbulb className="h-4 w-4" />
                Our Beginning
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
                From classroom challenge to educational revolution
              </h2>
              
              <div className="space-y-6 text-muted-foreground">
                <p>
                  CoTeach began in 2023 when our founder, a high school teacher, became frustrated with 
                  traditional methods of gauging student understanding. She wanted to know, in real-time, 
                  which students were struggling and which concepts needed clarification.
                </p>
                
                <p>
                  What started as a simple feedback tool quickly evolved into a comprehensive platform for 
                  classroom engagement as teachers around the country shared their challenges and wishes.
                </p>
                
                <p>
                  Today, we've grown into an AI-powered teaching assistant that helps teachers create more 
                  engaging, effective, and inclusive lesson experiences. Our platform is used in thousands 
                  of classrooms worldwide, helping teachers connect with their students in meaningful ways.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 bg-gradient-to-r from-dark-purple/5 via-deep-sky-blue/5 to-harvest-gold/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-sea-green bg-sea-green/10 px-4 py-2 rounded-full mb-6">
            <Heart className="h-4 w-4" />
            Our Values
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6">
            What drives everything we do
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
            Our core values shape how we build our platform and serve our educational community.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/40">
                  <div className="bg-gradient-to-r from-deep-sky-blue to-harvest-gold p-3 rounded-xl w-fit mx-auto mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-purple mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
              <Users className="h-4 w-4" />
              Our Team
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6">
              Meet the educators and technologists
              <br />
              <span className="gradient-text">behind the platform</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our diverse team combines expertise in education, technology, and design 
              to build tools that make a real difference in classrooms.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="modern-card overflow-hidden group">
                <div className="aspect-[3/4] overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-dark-purple">{member.name}</h3>
                  <p className="text-deep-sky-blue font-medium mb-2">{member.role}</p>
                  <p className="text-muted-foreground">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-xl text-dark-purple mb-8">
              And many more dedicated professionals working to improve education!
            </p>
            <Button size="lg" variant="outline" asChild>
              <a href="#contact" className="inline-flex items-center gap-2">
                <span>Join Our Team</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-white via-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="modern-card p-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
                  <Mail className="h-4 w-4" />
                  Get In Touch
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
                  Have questions? We're here to help!
                </h2>
                
                <p className="text-muted-foreground mb-8">
                  Whether you're looking to implement our platform at your school, join our team, 
                  or just learn more about what we do, we'd love to hear from you.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-deep-sky-blue/10 p-3 rounded-xl">
                      <Mail className="h-5 w-5 text-deep-sky-blue" />
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-purple">Email</h4>
                      <p className="text-muted-foreground">contact@coteach.edu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-sea-green/10 p-3 rounded-xl">
                      <Phone className="h-5 w-5 text-sea-green" />
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-purple">Phone</h4>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-harvest-gold/10 p-3 rounded-xl">
                      <MapPin className="h-5 w-5 text-harvest-gold" />
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-purple">Address</h4>
                      <p className="text-muted-foreground">
                        123 Education Street<br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                <h3 className="text-xl font-bold text-dark-purple mb-6">Send us a message</h3>
                
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-deep-sky-blue focus:border-deep-sky-blue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-deep-sky-blue focus:border-deep-sky-blue"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-deep-sky-blue focus:border-deep-sky-blue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-deep-sky-blue focus:border-deep-sky-blue"
                    ></textarea>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
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
              <Link to="/" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Home
              </Link>
              <Link to="/features" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                Features
              </Link>
              <Link to="/about" className="hover:text-harvest-gold transition-colors text-white/80 hover:text-white">
                About
              </Link>
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

export default AboutPage;