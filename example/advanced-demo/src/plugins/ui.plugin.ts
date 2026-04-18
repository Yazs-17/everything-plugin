import { definePlugin } from "@yazs/everything-plugin";
import { QuillCodeEnv, Note } from "../types";

export const UIPlugin = definePlugin<QuillCodeEnv>("ui.layout", () => {
    return {
        priority: 50, // Must run after storage, before editor
        initialize(env) {
            const root = env.ui.root;
            root.style.display = 'flex';
            root.style.height = '100vh';
            
            // Sidebar
            const sidebar = document.createElement('div');
            sidebar.style.width = '250px';
            sidebar.style.borderRight = '1px solid #ccc';
            sidebar.style.backgroundColor = '#fafafa';
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
            
            // Sidebar Header
            const sidebarHeader = document.createElement('div');
            sidebarHeader.style.padding = '10px';
            sidebarHeader.style.borderBottom = '1px solid #ddd';
            sidebarHeader.style.display = 'flex';
            sidebarHeader.style.justifyContent = 'space-between';
            
            const title = document.createElement('h3');
            title.margin = '0';
            title.textContent = 'QuillCode';
            
            const newBtn = document.createElement('button');
            newBtn.textContent = '+';
            newBtn.onclick = () => {
                const newNote: Note = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: 'New Note',
                    content: '',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                env.services.eventBus.emit('cmd:save_note', newNote);
                env.services.eventBus.emit('cmd:open_note', newNote);
            };
            
            sidebarHeader.appendChild(title);
            sidebarHeader.appendChild(newBtn);
            sidebar.appendChild(sidebarHeader);
            
            // Sidebar List
            const noteList = document.createElement('ul');
            noteList.style.listStyle = 'none';
            noteList.style.padding = '0';
            noteList.style.margin = '0';
            noteList.style.overflowY = 'auto';
            noteList.style.flex = '1';
            sidebar.appendChild(noteList);
            
            // Editor Area
            const editorArea = document.createElement('div');
            editorArea.style.flex = '1';
            editorArea.style.display = 'flex';
            editorArea.style.flexDirection = 'column';
            editorArea.style.backgroundColor = '#fff';
            
            root.appendChild(sidebar);
            root.appendChild(editorArea);
            
            env.ui.sidebar = sidebar;
            env.ui.editorArea = editorArea;
            
            // UI Logic
            const renderList = (notes: Note[]) => {
                noteList.innerHTML = '';
                notes.forEach(note => {
                    const li = document.createElement('li');
                    li.style.padding = '10px';
                    li.style.borderBottom = '1px solid #eee';
                    li.style.cursor = 'pointer';
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    
                    const span = document.createElement('span');
                    span.textContent = note.title || 'Untitled Note';
                    span.style.flex = '1';
                    
                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'x';
                    delBtn.style.color = 'red';
                    delBtn.style.border = 'none';
                    delBtn.style.background = 'transparent';
                    delBtn.style.cursor = 'pointer';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        env.services.eventBus.emit('cmd:delete_note', note.id);
                    };
                    
                    li.appendChild(span);
                    li.appendChild(delBtn);

                    li.onclick = () => {
                        env.services.eventBus.emit('cmd:open_note', note);
                    };
                    noteList.appendChild(li);
                });
            };
            
            // Listen to data events to update UI
            env.services.eventBus.on('notes:loaded', renderList);
            env.services.eventBus.on('note:saved', () => {
                renderList(env.state.notes);
            });
            env.services.eventBus.on('note:deleted', () => {
                renderList(env.state.notes);
            });
            env.services.eventBus.on('search:results', (results: Note[]) => {
                renderList(results);
            });
        },
        async render(env) {
            // initial render of list
            if (env.state.notes.length > 0) {
                // optionally open first note
            }
        }
    };
});
