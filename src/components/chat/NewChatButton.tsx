import { Plus } from "lucide-react";
import { Button } from "../ui/button";



export function NewChatButton() {
  return (
    <Button variant="outline" className="w-full">
      <Plus />
      New Chat
    </Button>
  );
}