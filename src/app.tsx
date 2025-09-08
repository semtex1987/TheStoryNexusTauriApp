import { Link } from "react-router";
import { Bot, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function App() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-8">
			<div className="space-y-8 text-center">
				<div className="space-y-4">
					<h1 className="text-4xl font-bold tracking-tight">Lyric Loom</h1>
					<p className="text-muted-foreground">Your local-first writing companion</p>
				</div>

				<div className="flex flex-col gap-4 items-center">
					<Link to="/songs" className="w-full">
						<Button
							variant="outline"
							size="lg"
							className="w-[200px] h-[60px] text-lg hover:bg-accent hover:text-accent-foreground"
						>
							<BookOpen className="mr-2 h-5 w-5" />
							Songs
						</Button>
					</Link>

					<Link to="/ai-settings" className="w-full">
						<Button
							variant="outline"
							size="lg"
							className="w-[200px] h-[60px] text-lg hover:bg-accent hover:text-accent-foreground"
						>
							<Bot className="mr-2 h-5 w-5" />
							AI Settings
						</Button>
					</Link>

					<Link to="/guide" className="w-full">
						<Button
							variant="outline"
							size="lg"
							className="w-[200px] h-[60px] text-lg hover:bg-accent hover:text-accent-foreground"
						>
							<HelpCircle className="mr-2 h-5 w-5" />
							Guide
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
