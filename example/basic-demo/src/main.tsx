import { EnvExecutor } from './core/Executor'
import resizePlugin from './plugins/resize.plugin'
import clickPlugin from './plugins/click.plugin'
import { lifecycleTestPlugin } from './plugins/lifecycle-test.plugin'

const env = new EnvExecutor()

env.register([resizePlugin, clickPlugin, lifecycleTestPlugin])

env.start()

const btn = document.createElement('button')
btn.innerText = 'destroy all'
document.body.appendChild(btn)

btn.addEventListener('click', () => {
  env.destroy() // use env.destroy() instead of calling hookDestroy directly
})