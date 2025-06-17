import { Input } from "../ui/input";
import { NewChatButton } from "./NewChatButton";

export function ChatList() {
  return (
    <div className="flex flex-col gap-2">
      {/* search bar */}
      <div className="flex flex-col gap-2">
        <Input type="text" placeholder="Search" />
      </div>
      <div className="flex flex-col gap-2">
        <NewChatButton />
      </div>
    </div>
  );
}
