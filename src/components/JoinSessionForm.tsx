import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  getSessionByCode,
  addSessionParticipant,
  checkParticipantStatus,
  subscribeToParticipantStatus,
} from "../lib/supabase";
import { generateRandomName } from "../lib/utils";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface JoinSessionFormProps {
  onJoinSession: (code: string, name: string, avatarUrl?: string) => void;
}

export function JoinSessionForm({ onJoinSession }: JoinSessionFormProps) {
  const [sessionCode, setSessionCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [checking, setChecking] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const avatars = [
    "/images/avatars/co1.png",
    "/images/avatars/co2.png",
    "/images/avatars/co3.png",
    "/images/avatars/co4.png",
    "/images/avatars/co5.png",
    "/images/avatars/co6.png",
    "/images/avatars/co7.png",
    "/images/avatars/co8.png",
  ];

  // Check participant approval status with direct subscription
  useEffect(() => {
    if (!participantId || !sessionCode) return;

    console.log(
      `Setting up direct participant status subscription for ${participantId}`
    );

    const subscription = subscribeToParticipantStatus(
      participantId,
      (newStatus) => {
        console.log(
          `Received status update for participant ${participantId}: ${newStatus}`
        );

        // Update the status state
        setStatus(newStatus as "pending" | "approved" | "rejected");

        // Handle approval
        if (newStatus === "approved") {
          console.log("Participant approved - joining session");

          // Call onJoinSession after a short delay to show the success message
          setTimeout(() => {
            onJoinSession(
              sessionCode.trim().toUpperCase(),
              studentName,
              selectedAvatar || undefined
            );
          }, 1500);
        } else if (newStatus === "rejected") {
          setError(
            "Your name was not approved by the teacher. Please try again with a different name."
          );
          setIsJoining(false);
          setParticipantId(null);
        }
      }
    );

    // Initial status check
    const checkStatus = async () => {
      setChecking(true);
      try {
        console.log(
          `Performing initial status check for participant ${participantId}`
        );
        const currentStatus = await checkParticipantStatus(participantId);
        console.log("Current participant status:", currentStatus);

        if (currentStatus) {
          setStatus(currentStatus as "pending" | "approved" | "rejected");

          if (currentStatus === "approved") {
            // Already approved, join immediately
            onJoinSession(
              sessionCode.trim().toUpperCase(),
              studentName,
              selectedAvatar || undefined
            );
          } else if (currentStatus === "rejected") {
            setError(
              "Your name was not approved by the teacher. Please try again with a different name."
            );
            setIsJoining(false);
            setParticipantId(null);
          }
        }
      } catch (err) {
        console.error("Error in initial status check:", err);
      } finally {
        setChecking(false);
      }
    };

    // Run the initial check
    checkStatus();

    // Set up a polling fallback just in case the subscription doesn't work
    const pollingInterval = setInterval(async () => {
      if (status !== "pending") return;

      try {
        const currentStatus = await checkParticipantStatus(participantId);
        if (currentStatus === "approved") {
          setStatus("approved");
          onJoinSession(
            sessionCode.trim().toUpperCase(),
            studentName,
            selectedAvatar || undefined
          );
        } else if (currentStatus === "rejected") {
          setStatus("rejected");
          setError(
            "Your name was not approved by the teacher. Please try again with a different name."
          );
          setIsJoining(false);
          setParticipantId(null);
        }
      } catch (err) {
        console.error("Error checking participant status:", err);
      }
    }, 5000);

    return () => {
      console.log("Cleaning up participant status subscription and polling");
      subscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [
    participantId,
    sessionCode,
    studentName,
    onJoinSession,
    status,
    selectedAvatar,
  ]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      setError("Please enter a class code");
      return;
    }

    setIsJoining(true);
    setError("");
    setStatus(null);

    try {
      console.log("Checking session:", sessionCode.trim().toUpperCase());
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());

      if (!session) {
        setError("Invalid class code or expired session");
        setIsJoining(false);
        return;
      }

      // Use entered name or generate a random one if empty
      const name = studentName.trim() || generateRandomName();

      console.log("Adding participant:", {
        sessionCode: sessionCode.trim().toUpperCase(),
        name,
      });
      const participant = await addSessionParticipant(
        sessionCode.trim().toUpperCase(),
        name
      );

      if (!participant) {
        setError("Failed to join session. Please try again.");
        setIsJoining(false);
        return;
      }

      console.log("Added participant:", participant);

      // Store participant id for status checking
      setParticipantId(participant.id);
      setStatus("pending");
      setStudentName(name);
    } catch (err) {
      console.error("Error joining session:", err);
      setError(err instanceof Error ? err.message : "Failed to join session");
      setIsJoining(false);
    }
  };

  const handleSelectAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  if (status === "pending") {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-teal/20">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            {checking ? (
              <Loader2 className="w-12 h-12 text-teal animate-spin" />
            ) : (
              <AlertCircle className="w-12 h-12 text-orange" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2 text-teal">
            Waiting for Approval
          </h2>
          <p className="text-gray-600 mb-4">
            Your request to join this session is being reviewed by the teacher.
            Please wait a moment...
          </p>
          <div className="animate-pulse bg-orange/20 text-orange px-4 py-2 rounded-lg inline-block">
            Waiting for teacher approval...
          </div>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-teal/20">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-teal" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-teal">Approved!</h2>
          <p className="text-gray-600 mb-4">
            Your name has been approved by the teacher. Joining session...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-teal/20">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red">
            Membership Declined
          </h2>
          <p className="text-gray-600 mb-4">
            {error ||
              "Your request to join this session was declined by the teacher."}
          </p>
          <Button
            onClick={() => setStatus(null)}
            className="w-full mt-2 bg-teal hover:bg-teal/90 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-teal/20">
      <h2 className="text-2xl font-bold text-center text-teal mb-6">
        Join Class Session
      </h2>

      <form onSubmit={handleJoinSession} className="space-y-4">
        <Input
          label="Class Code"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-character code"
          maxLength={6}
          disabled={isJoining}
          className="uppercase border-teal/30 focus:border-teal focus:ring-teal"
          autoFocus
        />

        <Input
          label="Your Name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter your name or leave blank for random name"
          disabled={isJoining}
          className="border-teal/30 focus:border-teal focus:ring-teal"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Choose an Avatar (Optional)
          </label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {avatars.map((avatar, index) => (
              <div
                key={index}
                onClick={() => handleSelectAvatar(avatar)}
                className={`cursor-pointer p-2 rounded-lg transition-all ${
                  selectedAvatar === avatar
                    ? "ring-2 ring-teal bg-teal/10 scale-110"
                    : "hover:bg-teal/5 border border-teal/10"
                }`}
              >
                <Avatar className="h-12 w-12 mx-auto">
                  <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                  <AvatarFallback>{index + 1}</AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red border border-red/20 text-center flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isJoining || !sessionCode.trim()}
          className="w-full bg-teal hover:bg-teal/90 text-white"
          size="lg"
        >
          {isJoining ? "Joining..." : "Join Session"}
        </Button>
      </form>
    </div>
  );
}
