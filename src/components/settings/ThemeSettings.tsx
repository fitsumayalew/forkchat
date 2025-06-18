import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Sparkles, Trash2, Download, Upload, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../ThemeProvider";
import { 
  CustomTheme, 
  saveCustomTheme, 
  deleteCustomTheme as deleteThemeFromStorage,
} from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ThemeSettings() {
  const generateTheme = useAction(api.ai.chat.generateThemeColors);
  
  const { 
    theme: currentLightDarkMode, 
    customThemes, 
    refreshCustomThemes, 
    isCustomTheme,
    activeCustomTheme,
    setActiveCustomTheme 
  } = useTheme();
  
  const [selectedCustomTheme, setSelectedCustomTheme] = useState<string | null>(
    isCustomTheme ? activeCustomTheme?.id || null : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [themeDescription, setThemeDescription] = useState("");
  const [showThemeGenerator, setShowThemeGenerator] = useState(false);

  // Update local state when custom theme changes
  useEffect(() => {
    if (isCustomTheme && activeCustomTheme) {
      setSelectedCustomTheme(activeCustomTheme.id);
    } else {
      setSelectedCustomTheme(null);
    }
  }, [isCustomTheme, activeCustomTheme]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Apply the selected custom theme or clear it to use default
      setActiveCustomTheme(selectedCustomTheme);
      toast.success("Theme settings saved successfully");
    } catch (error) {
      toast.error("Failed to save theme settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTheme = async () => {
    if (!themeDescription.trim()) {
      toast.error("Please describe the theme you want to generate");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateTheme({ description: themeDescription });
      
      if (result.success && result.theme) {
        // Save the custom theme
        const savedTheme = saveCustomTheme({
          name: result.theme.name,
          description: result.theme.description,
          light: result.theme.light,
          dark: result.theme.dark,
        });
        
        // Refresh custom themes list
        refreshCustomThemes();
        
        // Apply the new theme
        setSelectedCustomTheme(savedTheme.id);
        
        // Clear the input and close dialog
        setThemeDescription("");
        setShowThemeGenerator(false);
        
        toast.success(`Custom theme "${result.theme.name}" generated and applied!`);
      } else {
        toast.error(result.error || "Failed to generate theme");
      }
    } catch (error) {
      console.error("Theme generation error:", error);
      toast.error("Failed to generate theme. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCustomTheme = (themeId: string) => {
    try {
      deleteThemeFromStorage(themeId);
      refreshCustomThemes();
      
      // If the deleted theme was selected, switch to default
      if (selectedCustomTheme === themeId) {
        setSelectedCustomTheme(null);
      }
      
      toast.success("Custom theme deleted");
    } catch (error) {
      toast.error("Failed to delete custom theme");
    }
  };

  const exportTheme = (theme: CustomTheme) => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeData = JSON.parse(e.target?.result as string);
        
        // Validate theme structure
        if (!themeData.name || !themeData.light || !themeData.dark) {
          throw new Error("Invalid theme file structure");
        }
        
        const savedTheme = saveCustomTheme({
          name: themeData.name,
          description: themeData.description || "Imported theme",
          light: themeData.light,
          dark: themeData.dark,
        });
        
        refreshCustomThemes();
        toast.success(`Theme "${themeData.name}" imported successfully!`);
      } catch (error) {
        toast.error("Failed to import theme. Please check the file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const getLightDarkModeIcon = () => {
    switch (currentLightDarkMode) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Monitor;
    }
  };

  const LightDarkIcon = getLightDarkModeIcon();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Selection
          </CardTitle>
          <CardDescription>
            Choose between the default theme or custom AI-generated themes. Use the light/dark toggle in the header to switch between light and dark modes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Mode Display */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <LightDarkIcon className="h-4 w-4" />
              <span className="font-medium">
                Current Mode: {currentLightDarkMode.charAt(0).toUpperCase() + currentLightDarkMode.slice(1)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Use the theme toggle in the header to switch between light, dark, and system modes.
            </p>
          </div>

          {/* Default Theme Option */}
          <div className="space-y-3">
            <Label>Theme Options</Label>
            <div
              className={`relative cursor-pointer rounded-lg border p-4 hover:bg-accent ${
                !selectedCustomTheme ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setSelectedCustomTheme(null)}
            >
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Default Theme</span>
                    {!selectedCustomTheme && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the standard application theme with your preferred light/dark mode
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Themes */}
          {customThemes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom Themes</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('theme-import')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <input
                    id="theme-import"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importTheme}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customThemes.map((theme) => {
                  const isSelected = selectedCustomTheme === theme.id;
                  
                  return (
                    <div
                      key={theme.id}
                      className={`relative cursor-pointer rounded-lg border p-4 hover:bg-accent ${
                        isSelected ? "border-primary bg-accent" : ""
                      }`}
                      onClick={() => setSelectedCustomTheme(theme.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium">{theme.name}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {theme.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(theme.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportTheme(theme);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomTheme(theme.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theme Generator */}
          <div className="space-y-3">
            <Label>Generate New Custom Theme</Label>
            <Dialog open={showThemeGenerator} onOpenChange={setShowThemeGenerator}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Theme with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Custom Theme</DialogTitle>
                  <DialogDescription>
                    Describe the theme you want and let AI create a beautiful color palette for you. The theme will work in both light and dark modes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-description">Theme Description</Label>
                    <Textarea
                      id="theme-description"
                      placeholder="e.g., 'A calming ocean theme with blues and greens' or 'Dark cyberpunk theme with neon accents'"
                      value={themeDescription}
                      onChange={(e) => setThemeDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateTheme}
                      disabled={isGenerating || !themeDescription.trim()}
                      className="flex-1"
                    >
                      {isGenerating ? "Generating..." : "Generate Theme"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowThemeGenerator(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Current Selection Preview */}
          {(selectedCustomTheme ? activeCustomTheme : true) && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {selectedCustomTheme ? (
                  <Sparkles className="h-4 w-4 text-primary" />
                ) : (
                  <Palette className="h-4 w-4" />
                )}
                <span className="font-medium">
                  Selected: {selectedCustomTheme ? 
                    customThemes.find(t => t.id === selectedCustomTheme)?.name || "Custom Theme" : 
                    "Default Theme"
                  }
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedCustomTheme ? 
                  customThemes.find(t => t.id === selectedCustomTheme)?.description || "Custom AI-generated theme" :
                  "Standard application theme that adapts to your light/dark mode preference"
                }
              </p>
            </div>
          )}

          {/* Preview */}
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
                    This is how messages will appear with your selected theme in {currentLightDarkMode} mode. 
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
        {isLoading ? "Applying Theme..." : "Apply Selected Theme"}
      </Button>
    </div>
  );
} 