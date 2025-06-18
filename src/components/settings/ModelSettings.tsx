import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { models } from "@/lib/models";
import { Heart, Plus, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

type ModelId = keyof typeof models;

const modelArray = Object.values(models).filter(model => !model.disabled);

const providerOptions = [
  { value: "openai", label: "OpenAI", description: "GPT models" },
  { value: "anthropic", label: "Anthropic", description: "Claude models" },
  { value: "google", label: "Google", description: "Gemini models" },
  { value: "groq", label: "Groq", description: "Fast inference" },
  { value: "openrouter", label: "OpenRouter", description: "Multiple providers" },
];

export function ModelSettings() {
  const userConfig = useQuery(api.account.queries.getUserConfiguration);
  const userApiKeys = useQuery(api.account.queries.getUserApiKeys);
  const updateUserConfig = useMutation(api.account.mutations.updateUserConfiguration);
  const addApiKey = useMutation(api.account.mutations.addApiKey);
  const deleteApiKey = useMutation(api.account.mutations.deleteApiKey);
  
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    (userConfig?.currentlySelectedModel as ModelId) || "claude-4-sonnet"
  );
  const [favoriteModels, setFavoriteModels] = useState<string[]>(
    userConfig?.favoriteModels || []
  );
  const [temperature, setTemperature] = useState(
    userConfig?.currentModelParameters?.temperature || 0.7
  );
  const [topP, setTopP] = useState(
    userConfig?.currentModelParameters?.topP || 0.9
  );
  const [preferOwnApiKeys, setPreferOwnApiKeys] = useState(
    userConfig?.preferOwnApiKeys || false
  );
  const [isLoading, setIsLoading] = useState(false);

  // API Key form state
  const [showAddKeyForm, setShowAddKeyForm] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  // Update local state when data loads
  useEffect(() => {
    if (userConfig) {
      setSelectedModel((userConfig.currentlySelectedModel as ModelId) || "claude-4-sonnet");
      setFavoriteModels(userConfig.favoriteModels || []);
      setTemperature(userConfig.currentModelParameters?.temperature || 0.7);
      setTopP(userConfig.currentModelParameters?.topP || 0.9);
      setPreferOwnApiKeys(userConfig.preferOwnApiKeys || false);
    }
  }, [userConfig]);

  const toggleFavorite = (modelId: string) => {
    setFavoriteModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserConfig({
        currentlySelectedModel: selectedModel,
        favoriteModels,
        currentModelParameters: {
          temperature,
          topP,
        },
        preferOwnApiKeys,
      });
      toast.success("Model settings saved successfully");
    } catch (error) {
      toast.error("Failed to save model settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!newKeyProvider || !newKeyName || !newKeyValue) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addApiKey({
        provider: newKeyProvider,
        keyName: newKeyName,
        apiKey: newKeyValue,
      });
      toast.success("API key added successfully");
      setShowAddKeyForm(false);
      setNewKeyProvider("");
      setNewKeyName("");
      setNewKeyValue("");
    } catch (error) {
      toast.error("Failed to add API key");
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      await deleteApiKey({ keyId: keyId as any });
      toast.success("API key deleted successfully");
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };


  const selectedModelInfo = models[selectedModel as keyof typeof models];
  const supportsParameters = selectedModelInfo?.features?.includes("parameters");

  return (
    <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
      <Card>
        <CardHeader>
          <CardTitle>Default Model</CardTitle>
          <CardDescription>
            Choose your preferred model for new conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-select">Selected Model</Label>
            <Select value={selectedModel} onValueChange={(value: ModelId) => setSelectedModel(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {modelArray.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.provider}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {model.features?.map((feature: string) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModelInfo && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">{selectedModelInfo.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedModelInfo.fullDescription}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedModelInfo.features?.map((feature: string) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Settings
          </CardTitle>
          <CardDescription>
            Manage your own API keys to use with supported models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="prefer-own-keys">Prefer my API keys</Label>
              <p className="text-sm text-muted-foreground">
                Use your own API keys when available instead of the default service
              </p>
            </div>
            <Switch
              id="prefer-own-keys"
              checked={preferOwnApiKeys}
              onCheckedChange={setPreferOwnApiKeys}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Your API Keys</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddKeyForm(!showAddKeyForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add API Key
              </Button>
            </div>

            {showAddKeyForm && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providerOptions.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{provider.label}</span>
                                <span className="text-xs text-muted-foreground">{provider.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., My OpenAI Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddApiKey}>Add Key</Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddKeyForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {userApiKeys && userApiKeys.length > 0 ? (
              <div className="space-y-3">
                {userApiKeys.map((key) => (
                  <div
                    key={key._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.keyName}</span>
                        <Badge variant="outline" className="text-xs">
                          {key.provider}
                        </Badge>
                        {key.isActive && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteApiKey(key._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API keys configured</p>
                <p className="text-sm">Add your own API keys to use with supported models</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {supportsParameters && (
        <Card>
          <CardHeader>
            <CardTitle>Model Parameters</CardTitle>
            <CardDescription>
              Fine-tune the behavior of models that support parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature}</span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(value: number[]) => setTemperature(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness. Lower values make responses more focused and deterministic.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="top-p">Top P</Label>
                <span className="text-sm text-muted-foreground">{topP}</span>
              </div>
              <Slider
                id="top-p"
                min={0}
                max={1}
                step={0.05}
                value={[topP]}
                onValueChange={(value: number[]) => setTopP(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls diversity. Lower values make responses more focused on likely tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Favorite Models</CardTitle>
          <CardDescription>
            Mark models as favorites for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {modelArray.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.shortDescription}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(model.id)}
                  className="shrink-0"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favoriteModels.includes(model.id)
                        ? "fill-current text-red-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Model Settings"}
      </Button>
    </div>
  );
} 