import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Monitor, Moon, Sun, Palette } from "lucide-react";
import { toast } from "sonner";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Light mode for bright environments",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark mode for low-light environments",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your system preference",
    icon: Monitor,
  },
];

export function ThemeSettings() {
  const userConfig = useQuery(api.account.queries.getUserConfiguration);
  const updateUserConfig = useMutation(api.account.mutations.updateUserConfiguration);
  
  const [selectedTheme, setSelectedTheme] = useState(
    userConfig?.theme || "system"
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when data loads
  useEffect(() => {
    if (userConfig) {
      setSelectedTheme(userConfig.theme || "system");
    }
  }, [userConfig]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserConfig({
        configuration: {
          theme: selectedTheme,
        },
      });
      
      // Apply theme immediately
      applyTheme(selectedTheme);
      
      toast.success("Theme settings saved successfully");
    } catch (error) {
      toast.error("Failed to save theme settings");
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  };

  const currentThemeOption = THEME_OPTIONS.find(option => option.value === selectedTheme);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedTheme === option.value;
                
                return (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border p-4 hover:bg-accent ${
                      isSelected ? "border-primary bg-accent" : ""
                    }`}
                    onClick={() => setSelectedTheme(option.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentThemeOption && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <currentThemeOption.icon className="h-4 w-4" />
                <span className="font-medium">Current: {currentThemeOption.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentThemeOption.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sample Chat Message</span>
                  <Badge>AI Assistant</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    This is how messages will appear with your selected theme. 
                    The colors and contrast will adjust based on your preference.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default">Primary Button</Button>
                  <Button size="sm" variant="outline">Secondary Button</Button>
                  <Button size="sm" variant="ghost">Ghost Button</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Theme Settings"}
      </Button>
    </div>
  );
} 