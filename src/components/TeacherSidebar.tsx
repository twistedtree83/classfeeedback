import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  LogOut, 
  Menu,
  Bell,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarBody, 
  SidebarLink, 
  useSidebar 
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
  const [activeTab, setActiveTab] = useState<'feedback' | 'participants' | 'questions'>('feedback');
  const { open } = useSidebar();
  
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
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => setActiveTab('feedback'),
      active: activeTab === 'feedback',
      notification: false
    },
    {
      label: "Participants",
      href: "#participants",
      icon: <Users className="h-5 w-5" />,
      onClick: () => setActiveTab('participants'),
      active: activeTab === 'participants',
      notification: pendingCount > 0,
      count: pendingCount
    },
    {
      label: "Questions",
      href: "#questions",
      icon: <HelpCircle className="h-5 w-5" />,
      onClick: () => setActiveTab('questions'),
      active: activeTab === 'questions',
      notification: hasNewQuestions
    }
  ];
  
  const secondaryLinks = [
    {
      label: "Lesson Plan",
      href: "#lesson",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => {
        // Navigate to the lesson plan
        if (presentationId) {
          navigate(`/planner/${presentationId}`);
        }
      }
    },
    {
      label: "End Session",
      href: "#end",
      icon: <LogOut className="h-5 w-5 text-terracotta" />,
      onClick: onEndSession
    }
  ];

  return (
    <SidebarBody className="flex flex-col h-full z-10 bg-white border-r border-antique/50">
      {pendingCount > 0 && (
        <div className={cn(
          "mb-6",
          !open ? "mx-auto" : "bg-terracotta/10 text-terracotta px-3 py-2 rounded-lg flex items-center justify-between"
        )}>
          {open ? (
            <>
              <div className="font-medium">Pending Approval</div>
              <div className="bg-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {pendingCount}
              </div>
            </>
          ) : (
            <div className="bg-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {pendingCount}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 mb-4">
        {links.map((link, idx) => (
          <SidebarLink 
            key={idx} 
            link={{
              ...link,
              active: link.active ? true : false,
              icon: <span className="text-slate-blue">{link.icon}</span>
            }} 
            className={link.active ? "bg-antique/50 text-slate-blue" : "hover:bg-antique/30"}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {open && (
          <div className="h-full overflow-y-auto">
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
              <TeachingFeedbackPanel 
                presentationId={presentationId}
                currentCardIndex={currentCardIndex}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-antique">
        <div className="space-y-1 mb-4">
          {secondaryLinks.map((link, idx) => (
            <SidebarLink 
              key={idx} 
              link={{
                ...link,
                icon: <span className={link.label === "End Session" ? "text-terracotta" : "text-slate-blue"}>{link.icon}</span>
              }}
              className={link.label === "End Session" ? "hover:bg-terracotta/10" : "hover:bg-antique/30"}
            />
          ))}
        </div>
        
        {open && (
          <div className="mt-4 flex items-center p-3 bg-antique/50 rounded-lg">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback className="bg-sage/30 text-slate-blue">
                {teacherInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-blue">{teacherName}</p>
              <p className="text-xs text-slate-blue/70">Teacher</p>
            </div>
          </div>
        )}
      </div>
    </SidebarBody>
  );
}