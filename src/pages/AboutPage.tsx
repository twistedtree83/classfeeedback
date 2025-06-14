import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Sparkles, 
  Award, 
  Heart, 
  ArrowRight,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogoWrapper } from '@/components/LogoWrapper';

export function AboutPage() {
  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Founder & CEO",
      bio: "Former high school teacher with 15 years of classroom experience and a PhD in Educational Technology.",
      image: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=1600"
    },
    {
      name: "Michael Chen",
      role: "Chief Technology Officer",
      bio: "Software engineer with a passion for education and 10+ years experience building educational technology.",
      image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1600"
    },
    {
      name: "Amara Williams",
      role: "Head of Curriculum",
      bio: "Curriculum specialist with expertise in designing engaging and effective learning experiences.",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1600"
    },
    {
      name: "James Rodriguez",
      role: "Lead Product Designer",
      bio: "UX/UI designer focused on creating intuitive and accessible educational interfaces.",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1600"
    }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We constantly push the boundaries of what's possible in educational technology."
    },
    {
      icon: Users,
      title: "Inclusivity",
      description: "We design for all learners, ensuring our platform works for diverse learning needs."
    },
    {
      icon: Zap,
      title: "Empowerment",
      description: "We give teachers powerful tools that amplify their impact in the classroom."
    },
    {
      icon: Heart,
      title: "Passion",
      description: "We're driven by a deep commitment to improving educational outcomes for all students."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-purple mb-6">
            Our Mission
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            We're on a mission to transform classroom interaction and enhance the teaching experience through innovative technology that puts teachers and students first.
          </p>
          <div className="flex justify-center">
            <div className="p-1 rounded-full bg-gradient-to-r from-dark-purple via-deep-sky-blue to-harvest-gold">
              <div className="bg-white rounded-full p-8">
                <LogoWrapper size="lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 bg-gradient-to-br from-dark-purple/5 via-transparent to-deep-sky-blue/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6">
              <BookOpen className="h-4 w-4" />
              Our Story
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              From Classroom to Innovation
            </h2>
          </div>
          
          <div className="prose prose-lg mx-auto">
            <p>
              CoTeach began in 2023 when our founder, Dr. Sarah Johnson, a high school teacher with 15 years of experience, became frustrated with the lack of real-time feedback tools in her classroom. She envisioned a platform that would allow students to communicate their understanding without disrupting the flow of the lesson.
            </p>
            
            <p>
              Partnering with technologist Michael Chen, they built the first prototype of CoTeach and tested it in Sarah's classroom. The results were immediate and profound: student engagement increased, learning outcomes improved, and Sarah gained valuable insights into her students' comprehension.
            </p>
            
            <p>
              What started as a solution for one classroom has grown into a comprehensive platform used by thousands of teachers worldwide. Our team has expanded to include curriculum specialists, designers, and engineers, all united by a passion for education and a belief in the power of technology to enhance the teaching and learning experience.
            </p>
            
            <p>
              Today, CoTeach continues to evolve based on feedback from our community of educators. We remain committed to our founding principle: creating tools that empower teachers to do what they do best—teach.
            </p>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-harvest-gold bg-harvest-gold/10 px-4 py-2 rounded-full mb-6">
              <Users className="h-4 w-4" />
              Our Team
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              Meet the People Behind CoTeach
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our diverse team combines expertise in education, technology, and design to create the best possible experience for teachers and students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="modern-card hover-lift p-6 text-center">
                <div className="mb-4">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white shadow-md"
                  />
                </div>
                <h3 className="text-xl font-bold text-dark-purple mb-1">{member.name}</h3>
                <p className="text-deep-sky-blue font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 bg-gradient-to-br from-dark-purple/10 via-transparent to-harvest-gold/10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-sea-green bg-sea-green/10 px-4 py-2 rounded-full mb-6">
              <Award className="h-4 w-4" />
              Our Values
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              What Drives Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our core values guide everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="modern-card p-6 hover-lift">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-deep-sky-blue/20 to-harvest-gold/20 p-3 rounded-xl">
                      <Icon className="h-6 w-6 text-dark-purple" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-purple mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-bice-blue bg-bice-blue/10 px-4 py-2 rounded-full mb-6">
              <MessageSquare className="h-4 w-4" />
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              What Educators Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="modern-card p-6 hover-lift">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex text-harvest-gold">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="flex-1 italic text-gray-700 mb-4">
                  "CoTeach has completely transformed my classroom. I now have real-time insights into student understanding, which allows me to adjust my teaching on the fly. The AI-powered lesson planning tools have saved me countless hours of preparation time."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                  <div>
                    <p className="font-bold text-dark-purple">Emily Rodriguez</p>
                    <p className="text-sm text-muted-foreground">High School Science Teacher</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-card p-6 hover-lift">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex text-harvest-gold">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <blockquote className="flex-1 italic text-gray-700 mb-4">
                  "As a special education teacher, I appreciate how CoTeach helps me create differentiated content for my students. The platform makes it easy to adapt materials to different learning needs, and the real-time feedback helps me identify which students need additional support."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                  <div>
                    <p className="font-bold text-dark-purple">Marcus Johnson</p>
                    <p className="text-sm text-muted-foreground">Special Education Teacher</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-dark-purple text-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/10 px-4 py-2 rounded-full mb-6">
              <BarChart3 className="h-4 w-4" />
              Our Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Making a Difference in Education
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-harvest-gold mb-2">
                10,000+
              </div>
              <div className="text-white/80">Teachers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-deep-sky-blue mb-2">
                500,000+
              </div>
              <div className="text-white/80">Students</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-sea-green mb-2">
                1M+
              </div>
              <div className="text-white/80">Lessons Created</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                50+
              </div>
              <div className="text-white/80">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="modern-card p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-purple mb-6">
              Join Our Community of Educators
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the power of real-time feedback and AI-enhanced teaching tools. Sign up today and transform your classroom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}