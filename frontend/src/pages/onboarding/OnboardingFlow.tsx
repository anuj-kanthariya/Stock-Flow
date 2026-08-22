import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { updateCurrentUserProfile } from "@/lib/api/users";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function OnboardingFlow() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.company_name || !formData.email || !formData.phone || !formData.business_address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      await updateCurrentUserProfile(formData);
      await checkAuth(); // Refresh user state
      toast.success("Business profile created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save business profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground shadow-lg rounded-xl w-full max-w-xl overflow-hidden border border-border">
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Complete Your Business Profile 👋</h1>
            <p className="text-muted-foreground text-sm">
              Add your business details to start creating professional invoices.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  readOnly
                  className="bg-muted"
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

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
