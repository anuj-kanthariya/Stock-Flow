import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, FileText, Users, TrendingUp, Loader2 } from "lucide-react";
import { invoices } from "@/data/dummy";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api/users";

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState("");

  const activityStats = [
    { label: "Invoices Created", value: "128", icon: FileText, color: "text-primary" },
    { label: "Customers Added", value: "42", icon: Users, color: "text-emerald-600" },
    { label: "Total Billed", value: formatCurrency(4_200_000), icon: TrendingUp, color: "text-violet-600" },
  ];

  const fetchProfile = async () => {
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      console.log("----- PROFILE FETCH TRACE -----");
      console.log("Fetching profile for user:", user.id);

      setEmail(user.email || "");

      const profile = await getCurrentUserProfile();

      console.log("Fetched profile from API:", profile);

      // Map values
      // If DB has no name, try Google auth metadata
      const authMetadata = (await supabase.auth.getUser()).data.user?.user_metadata;
      
      const resolvedName = profile.name || authMetadata?.full_name || authMetadata?.name || user.email?.split("@")[0] || "User";
      setName(resolvedName);
      
      setPhone(profile.phone || profile.mobile_number || "");
      
      const resolvedRole = profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "User";
      setRole(resolvedRole);

      const resolvedAvatar = profile.avatar_url || authMetadata?.avatar_url || authMetadata?.picture || "";
      console.log("Resolved Avatar URL (DB > Auth Metadata):", resolvedAvatar);
      setAvatarUrl(resolvedAvatar);

    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateCurrentUserProfile({
        name: name,
        phone: phone || undefined,
      });

      toast.success("Profile updated successfully!");
      checkAuth(); // Refresh global auth state if needed
      await fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("----- AVATAR UPLOAD TRACE -----");
    console.log("AUTH USER:", user);
    
    if (!file || !user) {
      console.log("No file or no user found. Aborting.");
      return;
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error("File is too large. Please upload an image smaller than 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      console.log("GENERATED AVATAR URL:", cacheBustedUrl);

      // 1. Update the database profile
      console.log("Updating profile table for user:", user.id);
      const { data: updateData, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", user.id)
        .select();

      console.log("PROFILE UPDATE RESULT:", updateData);
      console.log("PROFILE UPDATE ERROR:", updateError);

      if (updateError) throw updateError;
      if (!updateData || updateData.length === 0) {
        throw new Error("Database update failed silently (0 rows affected). You are missing an UPDATE policy for the 'profiles' table in Supabase RLS.");
      }

      // 2. Update the Auth metadata so the Navbar (AuthContext) updates immediately
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: cacheBustedUrl }
      });
      
      if (authError) {
        console.error("Auth metadata update failed:", authError);
        throw new Error("Failed to update user auth metadata.");
      }

      // 3. Update local state explicitly AFTER database and auth updates succeed
      console.log("Setting local React state avatarUrl to:", cacheBustedUrl);
      setAvatarUrl(cacheBustedUrl);
      
      // Fetch profile again to verify database persistence
      const { data: refreshedProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      console.log("PROFILE AFTER UPDATE (refetched):", refreshedProfile);

      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes("bucket not found")) {
        toast.error("Avatar storage is not configured. Please create the 'avatars' storage bucket in Supabase.");
      } else {
        toast.error(error.message || "Failed to upload avatar.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      

      <PageHeader
        title="My Profile"
        description="Manage your personal information and activity"
        breadcrumbs={[{ label: "Profile" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || ""} alt={name} key={avatarUrl} />
                <AvatarFallback className="text-2xl font-bold">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
            </div>
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
            <Badge variant="info" className="mt-2">{role}</Badge>
            
            <Separator className="my-4 w-full" />
            <div className="w-full space-y-3">
              {activityStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-semibold">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Personal Info</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-email">Email Address</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={email}
                        readOnly
                        className="opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-phone">Phone</Label>
                      <Input
                        id="profile-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Not provided"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-role">Role</Label>
                      <Input id="profile-role" value={role} readOnly className="opacity-60 cursor-not-allowed" />
                    </div>
                  </div>
                  
                  <Separator />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="min-w-[120px]"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices Created</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.customerName} · {formatDate(inv.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(inv.total)}</span>
                          <InvoiceStatusBadge status={inv.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
