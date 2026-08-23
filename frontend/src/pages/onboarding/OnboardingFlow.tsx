import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { updateCurrentUserProfile, uploadCompanyLogo } from "@/lib/api/users";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ImageCropModal } from "@/components/shared/ImageCropModal";
import { getNormalizedImageUrl } from "@/lib/image-utils";
import { Building2, Camera, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface OnboardingFlowProps {
  onClose?: () => void;
}

export function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    company_name: user?.company_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gst_number: user?.gst_number || "",
    business_address: user?.business_address || "",
  });

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  
  const initialLogo = user?.company_logo_url || null;
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(
    initialLogo ? (getNormalizedImageUrl(initialLogo as string) || null) : null
  );

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        name: prev.name || user.name || "",
        company_name: prev.company_name || user.company_name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        gst_number: prev.gst_number || user.gst_number || "",
        business_address: prev.business_address || user.business_address || "",
      }));
      if (!selectedLogoFile && user.company_logo_url) {
        setPreviewLogoUrl(getNormalizedImageUrl(user.company_logo_url as string) || null);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleCropComplete = (croppedFile: File) => {
    setSelectedLogoFile(croppedFile);
    setPreviewLogoUrl(URL.createObjectURL(croppedFile));
    setIsCropModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.company_name || !formData.email || !formData.phone || !formData.business_address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      // If a new logo was selected, upload it first
      if (selectedLogoFile) {
        await uploadCompanyLogo(selectedLogoFile);
      }

      await updateCurrentUserProfile(formData);
      await checkAuth(); // Refresh user state globally
      toast.success("Business profile created successfully!");
      if (onClose) onClose();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save business profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()} // Prevent clicking outside to close
        >
          {onClose && (
            <button
              type="button"
              onClick={() => onClose()}
              aria-label="Close"
              className="absolute right-5 top-4 z-20 h-8 w-8 rounded-full flex items-center justify-center bg-secondary border border-border/50 text-muted-foreground transition-all duration-200 hover:scale-[1.03] hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-[18px] w-[18px] stroke-[2px]" />
            </button>
          )}
          <DialogHeader className="text-center sm:text-center relative px-10">
            <DialogTitle className="text-2xl font-bold tracking-tight">Complete Your Business Profile 👋</DialogTitle>
            <DialogDescription>
              Add your business details to start creating professional invoices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Owner Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter owner's full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    readOnly={!!user?.email}
                    className={user?.email ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number (Optional)</Label>
                <Input
                  id="gst_number"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="e.g. 29AADCS1234F1Z5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address *</Label>
                <Textarea
                  id="business_address"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleChange}
                  placeholder="Full address of your business"
                  required
                  rows={3}
                />
              </div>

              {/* Company Logo Section */}
              <div className="space-y-3 pt-2">
                <Label>Company Logo (Optional)</Label>
                <div className="flex items-center gap-6 p-4 border rounded-lg bg-card">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {previewLogoUrl ? (
                      <img
                        src={previewLogoUrl}
                        alt="Company Logo Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Upload Logo
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or WEBP (max. 5MB)
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {previewLogoUrl ? 'Change Logo' : 'Select Logo'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onClose && onClose()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {cropImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          aspect={1}
          title="Adjust Company Logo"
          confirmText="Apply / Use Logo"
        />
      )}
    </>
  );
}
