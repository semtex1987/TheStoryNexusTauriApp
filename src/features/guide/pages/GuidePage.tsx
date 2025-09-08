import { useState } from "react";
import { Link } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import BasicsGuide from "../components/BasicsGuide";
import AdvancedGuide from "../components/AdvancedGuide";
import PromptGuide from "../components/PromptGuide";
import BrainstormGuide from "../components/BrainstormGuide";

export default function GuidePage() {
    const [activeTab, setActiveTab] = useState("basics");

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="flex items-center mb-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold ml-4">Lyric Loom Guide</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Welcome to Lyric Loom</CardTitle>
                    <CardDescription>
                        Your comprehensive guide to using this AI-powered song writing application
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="basics" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mb-8">
                            <TabsTrigger value="basics">Basics Guide</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced Guide</TabsTrigger>
                            <TabsTrigger value="prompts">Prompt Guide</TabsTrigger>
                            <TabsTrigger value="brainstorm">Brainstorm Guide</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basics" className="space-y-4">
                            <BasicsGuide />
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4">
                            <AdvancedGuide />
                        </TabsContent>

                        <TabsContent value="prompts" className="space-y-4">
                            <PromptGuide />
                        </TabsContent>

                        <TabsContent value="brainstorm" className="space-y-4">
                            <BrainstormGuide />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
} 