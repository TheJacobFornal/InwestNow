import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE as string

type HelloResponse = { message: string }

async function getHello(name?: string): Promise<HelloResponse> {
  console.log(import.meta.env.VITE_API_BASE)
  const url = name ? `${API_BASE}/hello?name=${encodeURIComponent(name)}` : `${API_BASE}/hello`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

function App() {
  const [count, setCount] = useState(0)
  const [msg, setMsg] = useState<string>('')
  const [customName, setCustomName] = useState<string>('')

  const callDefault = async () => {
    try {
      const { message } = await getHello()
      setMsg(message)
    } catch (e: any) {
      setMsg(`Error: ${e.message ?? e}`)
    }
  }

  const callJacob = async () => {
    try {
      const { message } = await getHello('Jacob')
      setMsg(message)
    } catch (e: any) {
      setMsg(`Error: ${e.message ?? e}`)
    }
  }

  const callCustom = async () => {
    try {
      const { message } = await getHello(customName || undefined)
      setMsg(message)
    } catch (e: any) {
      setMsg(`Error: ${e.message ?? e}`)
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <h2>Call Python API /hello</h2>

        <button onClick={callDefault}>Say Hello (default)</button>
        <button onClick={callJacob}>Say Hello Jacob</button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="enter a name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button onClick={callCustom}>Say Hello (custom)</button>
        </div>

        <p><strong>Response:</strong> {msg}</p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
