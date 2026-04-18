import { definePlugin } from "@yazs/everything-plugin";
import { QuillCodeEnv, Note } from "../types";

export const SearchPlugin = definePlugin<QuillCodeEnv>("search.basic", () => {
    // Basic in-memory keyword index
    const index = new Map<string, string>(); // noteId -> indexed text

    return {
        priority: 70, // Run after storage so notes exist
        initialize(env) {
            env.services.search = {
                search(query: string): Note[] {
                    if (!query.trim()) return env.state.notes;
                    query = query.toLowerCase();
                    const results: Note[] = [];
                    for (const [id, text] of index.entries()) {
                        if (text.includes(query)) {
                            const note = env.state.notes.find(n => n.id === id);
                            if (note) results.push(note);
                        }
                    }
                    return results;
                },
                indexNote(note: Note) {
                    const text = `${note.title} ${note.content}`.toLowerCase();
                    index.set(note.id, text);
                },
                removeIndex(id: string) {
                    index.delete(id);
                }
            };

            // Hook into event bus
            env.services.eventBus.on('note:saved', (note: Note) => {
                env.services.search?.indexNote(note);
            });
            env.services.eventBus.on('note:deleted', (id: string) => {
                env.services.search?.removeIndex(id);
            });
            env.services.eventBus.on('notes:loaded', (notes: Note[]) => {
                notes.forEach(note => {
                    env.services.search?.indexNote(note);
                });
            });
        },
        render(env) {
            // Add UI for search if sidebar exists
            if (env.ui.sidebar) {
                const searchContainer = document.createElement('div');
                searchContainer.style.padding = '10px';
                searchContainer.style.borderBottom = '1px solid #eee';

                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.placeholder = 'Search notes...';
                searchInput.style.width = '100%';
                searchInput.style.padding = '5px';
                searchInput.style.boxSizing = 'border-box';

                searchContainer.appendChild(searchInput);
                
                // Insert search right after the absolute first element (the header)
                env.ui.sidebar.insertBefore(searchContainer, env.ui.sidebar.children[1]);

                searchInput.addEventListener('input', () => {
                    const query = searchInput.value;
                    const results = env.services.search?.search(query) || [];
                    // We emit a command to render the list, but it requires updating UIPlugin
                    // As UI is currently bound to env.state.notes, we will temporarily re-render inside UIPlugin
                    // We can implement a new event `search:results`
                    env.services.eventBus.emit('search:results', results);
                });
            }
        }
    };
});
