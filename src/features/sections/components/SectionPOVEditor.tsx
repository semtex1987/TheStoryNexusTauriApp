import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSectionStore } from "../stores/useSectionStore";
import { useSongContext } from "@/features/songs/context/SongContext";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SectionPOVEditorProps {
    onClose?: () => void;
}

interface POVForm {
    povType: 'First Person' | 'Third Person Limited' | 'Third Person Omniscient';
    povCharacter?: string;
}

export function SectionPOVEditor({ onClose }: SectionPOVEditorProps) {
    const { currentSectionId } = useSongContext();
    const { currentSection, updateSection } = useSectionStore();

    const form = useForm<POVForm>({
        defaultValues: {
            povType: currentSection?.povType || 'Third Person Omniscient',
            povCharacter: currentSection?.povCharacter,
        },
    });

    const povType = form.watch('povType');

    // Reset POV character when switching to omniscient
    useEffect(() => {
        if (povType === 'Third Person Omniscient') {
            form.setValue('povCharacter', undefined);
        }
    }, [povType, form]);

    const handleSubmit = async (data: POVForm) => {
        if (!currentSection) return;

        try {
            // Only include povCharacter if not omniscient
            const povCharacter = data.povType !== 'Third Person Omniscient' ? data.povCharacter : undefined;

            await updateSection(currentSection.id, {
                povType: data.povType,
                povCharacter
            });

            toast.success('Section POV updated successfully', {
                position: "bottom-center",
                autoClose: 1000,
                closeOnClick: true,
            });

            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to update section POV:', error);
            toast.error('Failed to update section POV');
        }
    };

    if (!currentSection) {
        return (
            <div className="flex items-center justify-center p-4">
                <p className="text-muted-foreground">No section selected</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="povType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Point of View</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select POV type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="First Person">First Person</SelectItem>
                                        <SelectItem value="Third Person Limited">Third Person Limited</SelectItem>
                                        <SelectItem value="Third Person Omniscient">Third Person Omniscient</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {povType !== 'Third Person Omniscient' && (
                        <FormField
                            control={form.control}
                            name="povCharacter"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>POV Character</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter character name"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
} 