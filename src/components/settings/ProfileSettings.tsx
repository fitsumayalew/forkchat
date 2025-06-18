import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

const COMMON_TRAITS = [
  "Creative", "Analytical", "Detail-oriented", "Big picture thinker",
  "Technical", "Non-technical", "Beginner", "Expert",
  "Casual", "Professional", "Direct", "Collaborative"
];

export function ProfileSettings() {
  const userCustomization = useQuery(api.account.queries.getUserPromptCustomization);
  const updateCustomization = useMutation(api.account.mutations.updateUserPromptCustomization);
  
  const [name, setName] = useState(userCustomization?.name || "");
  const [occupation, setOccupation] = useState(userCustomization?.occupation || "");
  const [selectedTraits, setSelectedTraits] = useState<string[]>(userCustomization?.selectedTraits || []);
  const [additionalInfo, setAdditionalInfo] = useState(userCustomization?.additionalInfo || "");
  const [customTrait, setCustomTrait] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when data loads
  useEffect(() => {
    if (userCustomization) {
      setName(userCustomization.name || "");
      setOccupation(userCustomization.occupation || "");
      setSelectedTraits(userCustomization.selectedTraits || []);
      setAdditionalInfo(userCustomization.additionalInfo || "");
    }
  }, [userCustomization]);

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const addCustomTrait = () => {
    if (customTrait.trim() && !selectedTraits.includes(customTrait.trim())) {
      setSelectedTraits(prev => [...prev, customTrait.trim()]);
      setCustomTrait("");
    }
  };

  const removeTrait = (trait: string) => {
    setSelectedTraits(prev => prev.filter(t => t !== trait));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateCustomization({
        name: name.trim() || undefined,
        occupation: occupation.trim() || undefined,
        selectedTraits: selectedTraits.length > 0 ? selectedTraits : undefined,
        additionalInfo: additionalInfo.trim() || undefined,
      });
      toast.success("Profile settings saved successfully");
    } catch (error) {
      toast.error("Failed to save profile settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Customization</CardTitle>
        <CardDescription>
          Customize how the AI interacts with you by providing information about yourself.
          This helps the AI provide more personalized and relevant responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              How would you like the AI to address you?
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              placeholder="e.g., Software Developer, Designer, Student"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your profession or role for context
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Personality Traits & Preferences</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TRAITS.map(trait => (
              <Badge
                key={trait}
                variant={selectedTraits.includes(trait) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTrait(trait)}
              >
                {trait}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add custom trait..."
              value={customTrait}
              onChange={(e) => setCustomTrait(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTrait()}
            />
            <Button type="button" onClick={addCustomTrait} variant="outline">
              Add
            </Button>
          </div>
          
          {selectedTraits.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Traits:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTraits.map(trait => (
                  <Badge key={trait} variant="secondary" className="gap-1">
                    {trait}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTrait(trait)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-info">Additional Information</Label>
          <Textarea
            id="additional-info"
            placeholder="Any other details that would help the AI understand you better..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Share any specific preferences, goals, or context that would improve your AI interactions
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Profile Settings"}
        </Button>
      </CardContent>
    </Card>
  );
} 