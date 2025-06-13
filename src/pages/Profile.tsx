import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { supabase } from "../lib/supabase";

export function Profile() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");
      setTitle(user.user_metadata?.title || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Name is required");
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          title: title,
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = () => {
    navigate("/update-password");
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/login");
    } else {
      setError(error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/50 to-white py-12">
        <div className="max-w-md mx-auto">
          <div className="modern-card hover-lift p-8 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-white/30">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-dark-purple/10 flex items-center justify-center">
                <User className="h-12 w-12 text-dark-purple" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-dark-purple mb-6">
              Profile Settings
            </h1>

            {error && (
              <div className="p-3 mb-4 rounded-md bg-red/10 text-red border border-red/20 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 rounded-md bg-sea-green/10 text-sea-green border border-sea-green/20 flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-dark-purple"
                >
                  Title
                </label>
                <select
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-purple/20 rounded-lg shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  required
                >
                  <option value="">Select a title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="h-5 w-5 text-muted-foreground" />}
                placeholder="Enter your name"
              />

              <Input
                label="Email"
                value={email}
                disabled
                icon={<Mail className="h-5 w-5 text-muted-foreground" />}
                className="bg-muted/50"
              />

              <div className="flex flex-col space-y-4">
                <Button type="submit" isLoading={isUpdating} className="w-full">
                  Save Changes
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangePassword}
                  className="w-full flex items-center justify-center"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default Profile;