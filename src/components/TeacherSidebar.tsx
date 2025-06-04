import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  LogOut, 
  Settings,
  BookOpen,
  Bell,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarBody, 
  SidebarLink 
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ParticipantsList } from './ParticipantsList';
import { TeachingFeedbackPanel } from './TeachingFeedbackPanel';

interface TeacherSidebarProps {
  sessionCode: string;
  presentationId: string;
  teacherName: string;
  pendingCount: number;
  hasNewQuestions: boolean;
  currentCardIndex: number;
  onEndSession: () => void;
}

export function TeacherSidebar({ 
  sessionCode, 
  presentationId,
  teacherName,
  pendingCount,
  hasNewQuestions, 
  currentCardIndex,
  onEndSession
}: TeacherSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'participants' | 'questions'>('feedback');
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const teacherInitials = teacherName ? getInitials(teacherName) : 
                         user?.user_metadata?.full_name ? 
                         getInitials(user.user_metadata.full_name) : 
                         'T';

  const links = [
    {
      label: "Feedback",
      href: "#feedback",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('feedback'),
      active: activeTab === 'feedback',
      notification: false
    },
    {
      label: "Participants",
      href: "#participants",
      icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('participants'),
      active: activeTab === 'participants',
      notification: pendingCount > 0,
      count: pendingCount
    },
    {
      label: "Questions",
      href: "#questions",
      icon: <HelpCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('questions'),
      active: activeTab === 'questions',
      notification: hasNewQuestions
    }
  ];
  
  const secondaryLinks = [
    {
      label: "Lesson Plan",
      href: "#lesson",
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "End Session",
      href: "#end",
      icon: <LogOut className="text-red-600 h-5 w-5 flex-shrink-0" />,
      onClick: onEndSession
    }
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="border-l border-gray-200 shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="text-indigo-600 h-6 w-6 flex-shrink-0" />
            <span className="font-bold text-lg">Teaching Mode</span>
          </div>
          
          <div className="bg-indigo-50 text-indigo-800 px-3 py-2 rounded-lg mb-6 flex items-center justify-between">
            <div className="font-mono font-medium">{sessionCode}</div>
            {pendingCount > 0 && (
              <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {pendingCount}
              </div>
            )}
          </div>

          <div className="space-y-1 mb-8">
            {links.map((link, idx) => (
              <div 
                key={idx} 
                onClick={link.onClick}
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-lg cursor-pointer relative",
                  link.active 
                    ? "bg-indigo-100 text-indigo-900" 
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  <span className="font-medium">{link.label}</span>
                </div>
                
                {link.notification && (
                  <div className="ml-auto">
                    {typeof link.count === 'number' ? (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {link.count}
                      </span>
                    ) : (
                      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'feedback' && (
              <TeachingFeedbackPanel 
                presentationId={presentationId}
                currentCardIndex={currentCardIndex}
              />
            )}
            
            {activeTab === 'participants' && (
              <ParticipantsList sessionCode={sessionCode} />
            )}
            
            {activeTab === 'questions' && (
              <div className="p-4">
                <h3 className="font-medium mb-2">Student Questions</h3>
                <TeachingFeedbackPanel 
                  presentationId={presentationId}
                  currentCardIndex={currentCardIndex}
                />
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="space-y-1">
              {secondaryLinks.map((link, idx) => (
                <div 
                  key={idx} 
                  onClick={link.onClick}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-lg cursor-pointer",
                    link.label === 'End Session' 
                      ? "hover:bg-red-50 text-red-600" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {link.icon}
                  <span className="ml-3 font-medium">{link.label}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-indigo-100 text-indigo-800">
                  {teacherInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{teacherName}</p>
                <p className="text-xs text-gray-500">Teacher</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}