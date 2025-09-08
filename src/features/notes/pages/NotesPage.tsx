import { useParams } from 'react-router';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';

export default function NotesPage() {
    const { songId } = useParams();

    if (!songId) {
        return <div>Song ID is required</div>;
    }

    return (
        <div className="h-full flex">
            <NoteList songId={songId} />
            <div className="flex-1">
                <NoteEditor songId={songId} />
            </div>
        </div>
    );
} 