import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Download, 
  Trash2, 
  UserX, 
  Shield,
  Database
} from "lucide-react";
import { toast } from "sonner";

export function AccountSettings() {
  const deleteHistory = useMutation(api.account.mutations.deleteHistory);
  const deleteAccount = useMutation(api.account.mutations.deleteAccount);
  
  const [isDeleteHistoryLoading, setIsDeleteHistoryLoading] = useState(false);
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState("");
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showDeleteHistoryDialog, setShowDeleteHistoryDialog] = useState(false);

  const handleDeleteHistory = async () => {
    setIsDeleteHistoryLoading(true);
    try {
      await deleteHistory();
      toast.success("Chat history deleted successfully");
      setShowDeleteHistoryDialog(false);
    } catch (error) {
      toast.error("Failed to delete chat history");
    } finally {
      setIsDeleteHistoryLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    
    setIsDeleteAccountLoading(true);
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      // The user will be redirected to login by the auth system
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleteAccountLoading(false);
    }
  };

  const handleExportData = () => {
    // This would typically trigger a data export
    toast.info("Data export feature coming soon");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your personal data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="font-medium">Export Data</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your data including conversations and settings
              </p>
            </div>
            <Button onClick={handleExportData} variant="outline">
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <span className="font-medium">Data Retention</span>
              <p className="text-sm text-muted-foreground">
                Your conversations are stored securely and can be deleted at any time
              </p>
            </div>
            <Shield className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="font-medium">Delete Chat History</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your conversations and messages
              </p>
            </div>
            <Dialog open={showDeleteHistoryDialog} onOpenChange={setShowDeleteHistoryDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Chat History</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your conversations, messages, and attachments. 
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteHistoryDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteHistory}
                    disabled={isDeleteHistoryLoading}
                  >
                    {isDeleteHistoryLoading ? "Deleting..." : "Delete History"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-destructive" />
                <span className="font-medium">Delete Account</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account and ALL associated data including:
                    conversations, messages, attachments, settings, and profile information.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation">
                      Type <strong>DELETE</strong> to confirm:
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteAccountConfirmation}
                      onChange={(e) => setDeleteAccountConfirmation(e.target.value)}
                      placeholder="Type DELETE here"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteAccountDialog(false);
                      setDeleteAccountConfirmation("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleteAccountLoading || deleteAccountConfirmation !== "DELETE"}
                  >
                    {isDeleteAccountLoading ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 