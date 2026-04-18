import { createEnv, QuillCodeApp } from './env';
import { LocalStoragePlugin } from './plugins/storage.plugin';
import { UIPlugin } from './plugins/ui.plugin';
import { EditorPlugin } from './plugins/editor.plugin';
import { SearchPlugin } from './plugins/search.plugin';

async function bootstrap() {
  const root = document.getElementById('app');
  if (!root) throw new Error('Root element #app not found');

  const env = createEnv(root);
  const app = new QuillCodeApp(env);

  // Register the plugins
  app.registerPlugins([
    LocalStoragePlugin,
    UIPlugin,
    EditorPlugin,
    SearchPlugin
  ]);

  // Start the application pipeline
  await app.start();

  console.log('[QuillCode] Application started using @yazs/everything-plugin architecture!');
}

bootstrap().catch(console.error);
