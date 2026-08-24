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
import { getCurrentUserProfile, updateCurrentUserProfile, uploadUserAvatar } from "@/lib/api/users";
import { getNormalizedImageUrl } from "@/lib/image-utils";
import { ImageCropModal } from "@/components/shared/ImageCropModal";

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

  // Crop Modal State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

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

      const rawAvatar = profile.avatar_url || authMetadata?.avatar_url || authMetadata?.picture || "";
      const resolvedAvatar = getNormalizedImageUrl(rawAvatar) || "";
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
        email: email,
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP formats are allowed");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result?.toString() || null);
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    try {
      // 1. Upload the cropped image
      const updatedProfile = await uploadUserAvatar(croppedFile);
      
      // 2. Globally sync the auth session and user context
      await checkAuth();
      
      // 3. Update local UI state
      if (updatedProfile && typeof updatedProfile === 'object') {
        const newAvatarUrl = updatedProfile.avatar_url;
        if (typeof newAvatarUrl === 'string' && newAvatarUrl.trim() !== '') {
          setAvatarUrl(getNormalizedImageUrl(newAvatarUrl) || "");
        }
      }
      
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Failed to upload profile picture";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setIsCropModalOpen(false);
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
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full pb-24 md:pb-0">
      <div className="hidden md:block">
        <PageHeader
          title="My Profile"
          description="Manage your personal information and activity"
          breadcrumbs={[{ label: "Profile" }]}
        />
      </div>

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
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
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
                        onChange={(e) => setEmail(e.target.value)}
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
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="w-full sm:w-auto min-w-[120px]"
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
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {inv.customerName} · {formatDate(inv.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-12 sm:pl-0">
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
      
      {cropImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </div>
  );
}
