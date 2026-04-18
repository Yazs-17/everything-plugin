import { definePlugin } from "@yazs/everything-plugin";
import { QuillCodeEnv, Note } from "./types";

export const LocalStoragePlugin = definePlugin<QuillCodeEnv>("storage.local", () => {
    const STORAGE_KEY = "quillcode_notes";
    
    return {
        priority: 100, // Load storage service early
        initialize(env) {
            env.services.storage = {
                async saveNote(note: Note) {
                    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    const index = notes.findIndex((n: Note) => n.id === note.id);
                    if (index >= 0) {
                        notes[index] = note;
                    } else {
                        notes.push(note);
                    }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
                    env.state.notes = notes;
                    env.services.eventBus.emit('note:saved', note);
                },
                async loadNotes(): Promise<Note[]> {
                    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    env.state.notes = notes;
                    env.services.eventBus.emit('notes:loaded', notes);
                    return notes;
                },
                async deleteNote(id: string) {
                    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    notes = notes.filter((n: Note) => n.id !== id);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
                    env.state.notes = notes;
                    env.services.eventBus.emit('note:deleted', id);
                }
            };
            
            // Listen for system events to trigger storage
            env.services.eventBus.on('cmd:save_note', async (note: Note) => {
                await env.services.storage?.saveNote(note);
            });
            env.services.eventBus.on('cmd:delete_note', async (id: string) => {
                await env.services.storage?.deleteNote(id);
            });
            env.services.eventBus.on('cmd:load_notes', async () => {
                await env.services.storage?.loadNotes();
            });
        },
        async renderBefore(env) {
            // Ensure data is loaded to state
            await env.services.storage?.loadNotes();
        }
    };
});