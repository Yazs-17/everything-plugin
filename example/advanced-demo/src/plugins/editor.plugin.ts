import { definePlugin } from "@yazs/everything-plugin";
import { QuillCodeEnv, Note } from "../types";

export const EditorPlugin = definePlugin<QuillCodeEnv>("editor.basic", () => {
    let currentNote: Note | null = null;
    let titleInput: HTMLInputElement;
    let contentArea: HTMLTextAreaElement;

    return {
        priority: 40,
        dependencies: ["ui.layout"],
        initialize(env) {
            const editorArea = env.ui.editorArea;
            if (!editorArea) throw new Error("Editor area not found.");

            editorArea.style.padding = '20px';
            editorArea.style.position = 'relative';

            // Title input
            titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.placeholder = 'Note Title';
            titleInput.style.fontSize = '24px';
            titleInput.style.border = 'none';
            titleInput.style.borderBottom = '1px solid #ccc';
            titleInput.style.marginBottom = '20px';
            titleInput.style.width = '100%';
            titleInput.style.outline = 'none';

            // Content area
            contentArea = document.createElement('textarea');
            contentArea.placeholder = 'Write your thoughts here...';
            contentArea.style.flex = '1';
            contentArea.style.border = 'none';
            contentArea.style.resize = 'none';
            contentArea.style.fontSize = '16px';
            contentArea.style.lineHeight = '1.5';
            contentArea.style.outline = 'none';

            editorArea.appendChild(titleInput);
            editorArea.appendChild(contentArea);

            const handleInput = () => {
                if (!currentNote) return;
                const updatedNote: Note = {
                    ...currentNote,
                    title: titleInput.value,
                    content: contentArea.value,
                    updatedAt: Date.now()
                };
                currentNote = updatedNote;
                env.services.eventBus.emit('cmd:save_note', updatedNote);
            };

            titleInput.addEventListener('input', handleInput);
            contentArea.addEventListener('input', handleInput);

            env.services.editor = {
                openNote(note: Note) {
                    currentNote = note;
                    env.state.currentNoteId = note.id;
                    titleInput.value = note.title;
                    contentArea.value = note.content;
                    contentArea.focus();
                },
                clear() {
                    currentNote = null;
                    env.state.currentNoteId = null;
                    titleInput.value = '';
                    contentArea.value = '';
                },
                getContent() {
                    return contentArea.value;
                },
                onContentChange(callback: (content: string) => void) {
                    contentArea.addEventListener('input', () => callback(contentArea.value));
                }
            };

            env.services.eventBus.on('cmd:open_note', (note: Note) => {
                env.services.editor?.openNote(note);
            });
        }
    };
});
