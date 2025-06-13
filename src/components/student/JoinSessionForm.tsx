import React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen } from "lucide-react";

interface JoinSessionFormProps {
  sessionCode: string;
  studentName: string;
  selectedAvatar: string;
  loading: boolean;
  error: string | null;
  availableAvatars: string[];
  onCodeChange: (code: string) => void;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function JoinSessionForm({
  sessionCode,
  studentName,
  selectedAvatar,
  loading,
  error,
  availableAvatars,
  onCodeChange,
  onNameChange,
  onAvatarChange,
  onSubmit,
}: JoinSessionFormProps) {
  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-teal/20">
        <div className="flex justify-center mb-6">
          <BookOpen className="h-12 w-12 text-teal" />
        </div>

        <h2 className="text-2xl font-bold text-teal mb-6 text-center">
          Join Classroom Session
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label="Session Code"
            value={sessionCode}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            disabled={loading}
            className="uppercase text-lg tracking-wide border-teal/30 focus:border-teal focus:ring-teal"
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <Input
              value={studentName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
              required
              className="border-teal/30 focus:border-teal focus:ring-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose an Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableAvatars.map((avatar, index) => (
                <div
                  key={index}
                  onClick={() => onAvatarChange(avatar)}
                  className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar
                      ? "border-teal bg-teal/10 scale-105"
                      : "border-gray-200 hover:border-teal/30 hover:bg-teal/5"
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
            <div className="p-4 rounded-lg bg-red/10 text-red border border-red/20 text-center flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !sessionCode.trim() || !studentName.trim()}
            className="w-full bg-teal hover:bg-teal/90 text-white"
            size="lg"
          >
            {loading ? "Joining..." : "Join Session"}
          </Button>
        </form>
      </div>
    </div>
  );
}
