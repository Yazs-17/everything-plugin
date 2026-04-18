export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuillCodeEnv {
  services: {
    eventBus: EventBusService;
    storage?: StorageService;
    editor?: EditorService;
    search?: SearchService;
  };
  ui: {
    root: HTMLElement;
    sidebar?: HTMLElement;
    editorArea?: HTMLElement;
  };
  state: {
    currentNoteId: string | null;
    notes: Note[];
  };
}

export type EventCallback = (payload?: any) => void;

export interface EventBusService {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, payload?: any): void;
}

export interface StorageService {
  saveNote(note: Note): Promise<void>;
  loadNotes(): Promise<Note[]>;
  deleteNote(id: string): Promise<void>;
}

export interface EditorService {
  openNote(note: Note): void;
  clear(): void;
  getContent(): string;
  onContentChange(callback: (content: string) => void): void;
}

export interface SearchService {
  search(query: string): Note[];
  indexNote(note: Note): void;
  removeIndex(id: string): void;
}
