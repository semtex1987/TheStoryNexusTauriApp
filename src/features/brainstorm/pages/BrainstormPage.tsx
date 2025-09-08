import { useParams } from 'react-router';
import ChatList from '../components/ChatList';
import ChatInterface from '../components/ChatInterface';
import { useBrainstormStore } from '../stores/useBrainstormStore';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BrainstormPage() {
    const { songId } = useParams<{ songId: string }>();
    const { selectedChat, createNewChat } = useBrainstormStore();

    if (!songId) {
        return <div>Song ID not found</div>;
    }

    return (
        <div className="flex h-full">
            <ChatList songId={songId} />
            <div className="flex-1 h-full">
                {selectedChat ? (
                    <ChatInterface songId={songId} />
                ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-6 text-muted-foreground p-4">
                        <MessageSquarePlus className="h-16 w-16 text-muted-foreground/50" />
                        <div className="text-center max-w-md">
                            <h3 className="text-xl font-semibold mb-2">No Chat Selected</h3>
                            <p className="mb-6">Select an existing chat from the sidebar or create a new one to start brainstorming ideas for your song.</p>
                            <Button
                                onClick={() => createNewChat(songId)}
                                className="flex items-center gap-2"
                            >
                                <MessageSquarePlus className="h-4 w-4" />
                                Create New Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 