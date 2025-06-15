import React, { useState, useEffect } from "react";
import { X, Search, BookText, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { 
  getRemedialAssignmentsForPresentation, 
  getParticipantsForSession, 
  assignRemedialContent,
  removeRemedialAssignment
} from "@/lib/supabase";
import type { LessonCard, LessonPresentation } from "@/lib/types";

interface RemedialAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: LessonPresentation;
  sessionCode: string;
}

export function RemedialAssignmentModal({
  isOpen,
  onClose,
  presentation,
  sessionCode
}: RemedialAssignmentModalProps) {
  const [participants, setParticipants] = useState<Array<{name: string; assigned: boolean}>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingStudents, setProcessingStudents] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [cardsWithRemedial, setCardsWithRemedial] = useState<LessonCard[]>([]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all participants for the session
        const participantsData = await getParticipantsForSession(sessionCode);
        
        // Get existing remedial assignments
        const assignmentsData = await getRemedialAssignmentsForPresentation(presentation.id);
        
        // Create a set of assigned student names
        const assignedStudents = new Set(
          assignmentsData.map(assignment => assignment.student_name)
        );
        
        // Format participant data
        const formattedParticipants = participantsData
          .filter(p => p.status === 'approved') // Only show approved participants
          .map(p => ({
            name: p.student_name,
            assigned: assignedStudents.has(p.student_name)
          }));
          
        setParticipants(formattedParticipants);
        
        // Find cards with remedial content
        const remedialCards = presentation.cards.filter(card => card.remedialActivity);
        setCardsWithRemedial(remedialCards);
        
      } catch (err) {
        console.error("Error loading participants or assignments:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, sessionCode, presentation]);
  
  const toggleStudentAssignment = async (studentName: string, currentlyAssigned: boolean) => {
    // Prevent multiple clicks
    if (processingStudents.has(studentName)) return;
    
    setProcessingStudents(prev => new Set(prev).add(studentName));
    
    try {
      if (currentlyAssigned) {
        // Remove assignment
        await removeRemedialAssignment(presentation.id, studentName);
      } else {
        // Create assignment
        await assignRemedialContent(presentation.id, studentName);
      }
      
      // Update local state
      setParticipants(prev => prev.map(p => {
        if (p.name === studentName) {
          return { ...p, assigned: !currentlyAssigned };
        }
        return p;
      }));
      
    } catch (err) {
      console.error(`Error ${currentlyAssigned ? "removing" : "creating"} assignment:`, err);
      setError(`Failed to ${currentlyAssigned ? "remove" : "create"} assignment`);
    } finally {
      setProcessingStudents(prev => {
        const next = new Set(prev);
        next.delete(studentName);
        return next;
      });
    }
  };
  
  // Filter participants based on search term
  const filteredParticipants = searchTerm.trim() 
    ? participants.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : participants;

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-purple-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookText className="h-5 w-5 mr-2 text-purple-600" />
              Assign Remedial Content to Students
            </h2>
            <Button 
              variant="ghost"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <>
              {cardsWithRemedial.length === 0 ? (
                <div className="text-center py-8 bg-purple-50 rounded-lg border border-purple-100">
                  <BookText className="h-12 w-12 mx-auto mb-3 text-purple-300" />
                  <h3 className="text-lg font-medium text-purple-800 mb-2">No Remedial Content Available</h3>
                  <p className="text-purple-600">
                    No cards with remedial content found. Create remedial versions of your cards first.
                  </p>
                  <Button
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-800 mb-2">Remedial Content Status</h3>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <p className="text-purple-800">
                        <span className="font-medium">{cardsWithRemedial.length} of {presentation.cards.length}</span> cards have remedial content available.
                      </p>
                    </div>
                  </div>
                
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search students..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-800 mb-2">Students</h3>
                    
                    {filteredParticipants.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">
                        {searchTerm ? "No students match your search" : "No students have joined this session yet"}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                        {filteredParticipants.map((participant) => (
                          <div 
                            key={participant.name}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              participant.assigned 
                                ? "border-purple-200 bg-purple-50" 
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div>
                              <div className="font-medium">{participant.name}</div>
                            </div>
                            <Button
                              onClick={() => toggleStudentAssignment(
                                participant.name,
                                participant.assigned
                              )}
                              variant={participant.assigned ? "default" : "outline"}
                              size="sm"
                              disabled={processingStudents.has(participant.name)}
                              className={participant.assigned 
                                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                : "border-purple-600 text-purple-600 hover:bg-purple-50"
                              }
                            >
                              {processingStudents.has(participant.name) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : participant.assigned ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <BookText className="h-4 w-4 mr-1" />
                              )}
                              {participant.assigned ? "Remove Assignment" : "Assign Remedial Content"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}