import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  User,
  AlertCircle,
  CheckCircle2,
  ArrowLeftCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import type { ParticipantStatus } from "../../lib/types";

interface StudentSessionJoinProps {
  sessionCode: string;
  studentName: string;
  loading: boolean;
  error: string | null;
  status: ParticipantStatus | null;
  checking: boolean;
  onSessionCodeChange: (code: string) => void;
  onStudentNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function StudentSessionJoin({
  sessionCode,
  studentName,
  loading,
  error,
  status,
  checking,
  onSessionCodeChange,
  onStudentNameChange,
  onSubmit,
}: StudentSessionJoinProps) {
  const navigate = useNavigate();

  // If approved, this component shouldn't render (handled by parent)
  if (status === "approved") {
    return null;
  }

  // Show status if participant is waiting for approval
  if (status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              {checking ? (
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Waiting for Approval
            </h2>

            <p className="text-gray-600 mb-6">
              Your teacher will approve you to join the lesson shortly. Please
              wait...
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Session Code:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {sessionCode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Student Name:</span>
                  <span className="font-medium text-gray-800">
                    {studentName}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <ArrowLeftCircle className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection status
  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Access Denied
            </h2>

            <p className="text-gray-600 mb-6">
              Your teacher has not approved your request to join this lesson.
              Please try again later or contact your teacher.
            </p>

            <Button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-2"
            >
              <ArrowLeftCircle className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show join form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Join Teaching Session
          </h1>
          <p className="text-gray-600">
            Enter your session code and name to join the lesson
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="sessionCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Session Code
            </label>
            <Input
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={(e) =>
                onSessionCodeChange(e.target.value.toUpperCase())
              }
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg font-mono tracking-wider"
              required
            />
          </div>

          <div>
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <Input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => onStudentNameChange(e.target.value)}
              placeholder="Enter your name"
              className="text-lg"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !sessionCode || !studentName}
            className="w-full flex items-center gap-2 text-lg py-3"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {loading ? "Joining..." : "Join Session"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
