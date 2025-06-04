import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart3, FileText, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogoWrapper } from '@/components/LogoWrapper';
import { HeroCard } from '@/components/ui/HeroCard';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal/10 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
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
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-teal text-center mb-12">Powerful features for modern educators</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg border border-teal/20 transition-all duration-200">
              <div className="bg-coral/10 p-3 rounded-full w-fit mb-4">
                <MessageSquare className="h-7 w-7 text-coral" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">Real-time Feedback</h3>
              <p className="text-gray-700">
                Get instant feedback from students during your lessons to gauge understanding and adjust your teaching on the fly.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg border border-teal/20 transition-all duration-200">
              <div className="bg-coral/10 p-3 rounded-full w-fit mb-4">
                <FileText className="h-7 w-7 text-coral" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">AI-Powered Lesson Planning</h3>
              <p className="text-gray-700">
                Upload your lesson plans and let our AI help organize, structure, and enhance them with teaching cards.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg border border-teal/20 transition-all duration-200">
              <div className="bg-coral/10 p-3 rounded-full w-fit mb-4">
                <Users className="h-7 w-7 text-coral" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">Student Engagement</h3>
              <p className="text-gray-700">
                Keep students engaged with interactive sessions, real-time messaging, and differentiated content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-teal/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-teal text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-orange/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">Create a Session</h3>
              <p className="text-gray-700">
                Generate a unique 6-digit class code for your students to join your teaching session.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-orange/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">Students Join</h3>
              <p className="text-gray-700">
                Students enter the class code to join your session from any device with a web browser.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-orange/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-teal">Receive Feedback</h3>
              <p className="text-gray-700">
                Monitor student understanding and questions in real-time throughout your lesson.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-coral/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-6 text-teal">Ready to transform your classroom?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700">
            Join thousands of educators who are enhancing student engagement and improving learning outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-teal hover:bg-teal/90 text-white"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button 
                    size="lg"
                    className="bg-teal hover:bg-teal/90 text-white"
                  >
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/join">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-coral text-coral hover:bg-coral/10"
                  >
                    Join as Student
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <LogoWrapper size="md" variant="full" className="text-white" />
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-orange transition-colors">About</a>
              <a href="#" className="hover:text-orange transition-colors">Features</a>
              <a href="#" className="hover:text-orange transition-colors">Pricing</a>
              <a href="#" className="hover:text-orange transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-teal-600/30 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2025 Classroom Feedback. All rights reserved.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Privacy & Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}