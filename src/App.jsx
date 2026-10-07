import { useEffect, useState } from 'react'
import { C } from './config'
import { sb } from './supabase'
import './styles.css'

const tag = { done: 'Done', doing: 'In progress', next: 'Next' }
const fmt = d => new Date(d).toLocaleDateString()
const toggleTheme = () => {
  const r = document.documentElement
  r.dataset.theme = getComputedStyle(r).getPropertyValue('--bg').trim() === '#0e1424' ? 'light' : 'dark'
}

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const f = () => setH(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h
}

function Blog() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    sb && sb.from('posts').select('*').order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []))
  }, [])
  return (
    <section id="log">
      <h2>Learning log</h2>
      <p className="sub">Notes from what I study, written as I go.</p>
      {!posts.length && <p className="sub">No posts yet.</p>}
      {posts.map(p => (
        <details key={p.id} className="post">
          <summary>{p.title}<small>{fmt(p.created_at)}</small></summary>
          <p style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
        </details>
      ))}
    </section>
  )
}

function Contact() {
  const [s, setS] = useState('')
  async function send(e) {
    e.preventDefault()
    const f = new FormData(e.target)
    if (f.get('website')) return
    if (!sb) return setS('error')
    setS('sending')
    const { error } = await sb.from('messages').insert({ name: f.get('name'), email: f.get('email'), message: f.get('message') })
    setS(error ? 'error' : 'sent')
    if (!error) e.target.reset()
  }
  return (
    <form className="form" onSubmit={send}>
      <input name="name" placeholder="Rasel Islam" required maxLength={100} />
      <input name="email" type="email" placeholder="raselbyte@gmail.com" required maxLength={200} />
      <textarea name="message" rows={4} placeholder="Message" required maxLength={3000} />
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button disabled={s === 'sending'}>Send message</button>
      {s === 'sent' && <span className="ok">Message sent. Thank you!</span>}
      {s === 'error' && <span className="err">Could not send. Please email me directly.</span>}
    </form>
  )
}

function Home() {
  return (
    <div className="wrap">
      <header className="top">
        <strong style={{ fontFamily: 'var(--head)', fontSize: 20 }}>{C.name}</strong>
        <nav>
          <a href="#plan">Plan</a><a href="#learning">Learning</a><a href="#experience">Experience</a>
          <a href="#projects">Projects</a><a href="#log">Log</a><a className="keep" href="#contact">Contact</a>
          <button className="theme" onClick={toggleTheme}>Theme</button>
        </nav>
      </header>
      <div className="hero">
        <h1>{C.headline}</h1>
        <p>{C.intro}</p>
        <a className="btn" href="#plan">See my plan</a>
        <a className="btn alt" href={encodeURI('/' + C.cv)} download>Download CV</a>
      </div>
      <section id="plan"><h2>My plan</h2><p className="sub">{C.planSub}</p>
        <ol className="road">{C.plan.map(p => (
          <li key={p.title} className={p.status}>
            <h3>{p.title}<span className="tag">{tag[p.status]}</span></h3>
            <div className="when">{p.when}</div><p>{p.text}</p>
          </li>))}</ol>
      </section>
      <section id="learning"><h2>What I'm learning</h2><p className="sub">{C.learnSub}</p>
        <div className="learn">{C.learning.map(s => (
          <div className="skill" key={s.skill}>
            <div className="row"><span>{s.skill}</span><span>{s.level}%</span></div>
            <div className="bar"><i style={{ width: s.level + '%' }} /></div><small>{s.note}</small>
          </div>))}</div>
      </section>
      <section id="experience"><h2>Experience</h2><p className="sub">{C.expSub}</p>
        {C.experience.map(j => (
          <div className="job" key={j.role + j.date}>
            <div className="date">{j.date}</div>
            <div><h3>{j.role}</h3><div className="org">{j.org}</div>
              <ul>{j.points.map(p => <li key={p}>{p}</li>)}</ul></div>
          </div>))}
      </section>
      <section id="projects"><h2>Projects</h2><p className="sub">{C.projSub}</p>
        <div className="projects">{C.projects.map(p => (
          <a className="proj" key={p.name} href={p.url}><h3>{p.name}</h3><p>{p.text}</p><span>{p.stack}</span></a>))}</div>
      </section>
      <Blog />
      <footer id="contact">
        <h2 style={{ fontSize: 26 }}>Let's talk</h2>
        <p>{C.contactText}</p>
        <Contact />
        <p className="links"><a href={'mailto:' + C.email}>{C.email}</a>
          {C.links.map(l => <a key={l.label} href={l.url} target="_blank" rel="noopener">{l.label}</a>)}</p>
        <p>© {new Date().getFullYear()} {C.name}</p>
      </footer>
    </div>
  )
}

function Admin() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [msgs, setMsgs] = useState([])
  const [err, setErr] = useState('')
  const load = async () => {
    setPosts((await sb.from('posts').select('*').order('created_at', { ascending: false })).data || [])
    setMsgs((await sb.from('messages').select('*').order('created_at', { ascending: false })).data || [])
  }
  useEffect(() => {
    if (!sb) return
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user || null))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => { user && load() }, [user])
  const login = async e => {
    e.preventDefault()
    const f = new FormData(e.target)
    const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') })
    setErr(error ? error.message : '')
  }
  const add = async e => {
    e.preventDefault()
    const f = new FormData(e.target)
    const { error } = await sb.from('posts').insert({ title: f.get('title'), body: f.get('body') })
    if (error) return setErr(error.message)
    e.target.reset(); setErr(''); load()
  }
  const del = async (t, id) => { await sb.from(t).delete().eq('id', id); load() }

  return (
    <div className="wrap admin">
      <header className="top"><strong>Admin</strong><nav><a href="#/">Back to site</a></nav></header>
      {!sb && <p className="err">Supabase is not configured. Add the two VITE_SUPABASE values.</p>}
      {sb && !user && (
        <form onSubmit={login} style={{ maxWidth: 360 }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button>Sign in</button>{err && <span className="err">{err}</span>}
        </form>
      )}
      {user && (<>
        <button className="del" onClick={() => sb.auth.signOut()}>Sign out</button>
        <h2 style={{ marginTop: 24 }}>New log post</h2>
        <form onSubmit={add}>
          <input name="title" placeholder="Title" required />
          <textarea name="body" rows={6} placeholder="What did you learn?" required />
          <button>Publish post</button>{err && <span className="err">{err}</span>}
        </form>
        <h2>Posts</h2>
        {posts.map(p => <div className="item" key={p.id}><span>{p.title} <small>{fmt(p.created_at)}</small></span>
          <button className="del" onClick={() => del('posts', p.id)}>Delete</button></div>)}
        <h2 style={{ marginTop: 28 }}>Messages</h2>
        {!msgs.length && <p className="sub">No messages yet.</p>}
        {msgs.map(m => <div className="item" key={m.id}>
          <span><b>{m.name}</b> ({m.email}) <small>{fmt(m.created_at)}</small><br />{m.message}</span>
          <button className="del" onClick={() => del('messages', m.id)}>Delete</button></div>)}
      </>)}
    </div>
  )
}

export default function App() {
  return useHash() === '#/admin' ? <Admin /> : <Home />
}
