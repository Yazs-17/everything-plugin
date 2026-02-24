import { EnvExecutor } from './core/Executor'
import resizePlugin from './plugins/resize.plugin'
import clickPlugin from './plugins/click.plugin'

const env = new EnvExecutor()

env.register([resizePlugin, clickPlugin])

env.start()

const btn = document.createElement('button')
btn.innerText = 'destroy all'
document.body.appendChild(btn)

btn.addEventListener('click', () => {
  env.pluginDriver.hookDestroy('destroy')
})