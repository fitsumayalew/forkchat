import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "./ProfileSettings";
import { ModelSettings } from "./ModelSettings";
import { ThemeSettings } from "./ThemeSettings";
import { AccountSettings } from "./AccountSettings";
import { Settings as SettingsIcon, User, Bot, Palette, Shield } from "lucide-react";

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
            </TabsContent>
            
            <TabsContent value="models" className="space-y-6">
              <ModelSettings />
            </TabsContent>
            
            <TabsContent value="theme" className="space-y-6">
              <ThemeSettings />
            </TabsContent>
            
            <TabsContent value="account" className="space-y-6">
              <AccountSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 