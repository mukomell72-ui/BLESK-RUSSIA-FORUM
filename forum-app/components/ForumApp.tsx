'use client';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {browserDb} from '@/lib/supabase/client';
import {actualSeason,defaultTheme,seasonNames,type ThemeRow,safeMediaUrl} from '@/lib/theme';
import SeasonEffects from '@/components/SeasonEffects';
import {Gamepad2,Search,Bell,UserRound,MessageSquare,ShieldCheck,LogIn,LogOut,Plus,Pin,Lock,ChevronRight,ArrowLeft,Send,Paperclip,Flame,Heart,ThumbsUp,FileWarning,Settings2,Menu,X,Clock,Users,MessagesSquare,LayoutGrid,CheckCircle2,AlertCircle,BookOpen,Inbox,Upload,Save,Eye,CalendarDays} from 'lucide-react';
type R=Record<string,any>;
type View='home'|'category'|'thread'|'cases'|'profile'|'messages'|'search';
const caseLabels:Record<string,string>={player:'Жалоба на игрока',admin:'Жалоба на администратора',leader:'Жалоба на лидера',appeal:'Обжалование наказания',application:'Заявление на должность',support:'Техподдержка'};
const caseStatus:Record<string,string>={review:'На рассмотрении',approved:'Одобрено',denied:'Отказано',evidence:'Нужны доказательства',closed:'Закрыто'};
const threadStatus:Record<string,string>={open:'Открыто',review:'На рассмотрении',approved:'Одобрено',denied:'Отказано',closed:'Закрыто'};
const date=(v:any)=>v?new Date(v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'}):'—';
const err=(e:any)=>e?.message||String(e)||'Неизвестная ошибка';
export default function ForumApp({initialThread}:{initialThread?:string}){
 const db=useMemo(()=>browserDb(),[]);
 const [user,setUser]=useState<User|null>(null);
 const [profile,setProfile]=useState<R|null>(null);
 const [profiles,setProfiles]=useState<R[]>([]);
 const [roles,setRoles]=useState<R[]>([]);const [memberships,setMemberships]=useState<R[]>([]);
 const [categories,setCategories]=useState<R[]>([]);const [servers,setServers]=useState<R[]>([]);
 const [threads,setThreads]=useState<R[]>([]);const [posts,setPosts]=useState<R[]>([]);
 const [cases,setCases]=useState<R[]>([]);const [news,setNews]=useState<R[]>([]);
 const [messages,setMessages]=useState<R[]>([]);const [notifications,setNotifications]=useState<R[]>([]);
 const [theme,setTheme]=useState<ThemeRow>(defaultTheme);
 const [view,setView]=useState<View>(initialThread?'thread':'home');
 const [activeCategory,setActiveCategory]=useState('');const [activeThread,setActiveThread]=useState(initialThread||'');
 const [showAuth,setShowAuth]=useState(false);const [register,setRegister]=useState(false);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [nickname,setNickname]=useState('');
 const [showNotice,setShowNotice]=useState(false);const [mobileNav,setMobileNav]=useState(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [info,setInfo]=useState('');
 const [search,setSearch]=useState('');const [searchResults,setSearchResults]=useState<R[]>([]);
 const [newThread,setNewThread]=useState(false);const [threadTitle,setThreadTitle]=useState('');const [threadBody,setThreadBody]=useState('');
 const [reply,setReply]=useState('');const [editingThread,setEditingThread]=useState(false);
 const [caseType,setCaseType]=useState('player');const [caseNick,setCaseNick]=useState('');const [caseSubject,setCaseSubject]=useState('');
 const [caseDescription,setCaseDescription]=useState('');const [caseEvidence,setCaseEvidence]=useState('');const [caseDate,setCaseDate]=useState('');const [caseServer,setCaseServer]=useState('');
 const [showCaseForm,setShowCaseForm]=useState(false);
 const [newMessageTo,setNewMessageTo]=useState('');const [newMessageBody,setNewMessageBody]=useState('');
 const [canAdmin,setCanAdmin]=useState(false);
 function fail(e:any){setError(err(e));setInfo('');window.scrollTo({top:0,behavior:'smooth'})}
 function okay(t:string){setInfo(t);setError('')}
 async function loadPublic(){
  const [cs,sv,th,nt,pf,rs,mr,tn]=await Promise.all([
   db.from('blezz_forum_categories').select('*').order('position'),
   db.from('blezz_forum_servers').select('*').order('position'),
   db.from('blezz_forum_threads').select('*').order('created_at',{ascending:false}).limit(200),
   db.from('blezz_forum_news').select('*').order('created_at',{ascending:false}).limit(6),
   db.from('blezz_forum_profiles').select('*').limit(500),
   db.from('blezz_forum_roles').select('*'),
   db.from('blezz_forum_user_roles').select('*'),
   db.from('blezz_forum_themes').select('*').eq('id',1).maybeSingle()
  ]);
  if(cs.error)fail(cs.error);
  setCategories(cs.data||[]);setServers(sv.data||[]);setThreads(th.data||[]);setNews(nt.data||[]);
  setProfiles(pf.data||[]);setRoles(rs.data||[]);setMemberships(mr.data||[]);
  if(tn.data)setTheme(tn.data as ThemeRow);
 }
 async function loadUser(u:User|null){
  setUser(u);if(!u){setProfile(null);setCases([]);setMessages([]);setNotifications([]);setCanAdmin(false);return}
  // A verified email can claim the one-time owner role. No browser-side privileged API key.
  if(u.email_confirmed_at)await db.rpc('blezz_forum_claim_owner');
  let q=await db.from('blezz_forum_profiles').select('*').eq('id',u.id).maybeSingle();
  if(!q.data){
   const suggested=((u.user_metadata?.username||u.email?.split('@')[0]||'Участник') as string).replace(/[^\p{L}\p{N}_-]/gu,'').slice(0,22);
   await db.from('blezz_forum_profiles').insert({id:u.id,username:(suggested.length>=3?suggested:'player')+'_'+u.id.slice(0,5)});
   q=await db.from('blezz_forum_profiles').select('*').eq('id',u.id).maybeSingle();
  }
  setProfile(q.data);
  const [c,n,m,admin]=await Promise.all([
   db.from('blezz_forum_cases').select('*').order('created_at',{ascending:false}),
   db.from('blezz_forum_notifications').select('*').order('created_at',{ascending:false}).limit(40),
   db.from('blezz_forum_messages').select('*').order('created_at',{ascending:false}).limit(100),
   db.rpc('blezz_forum_can',{p:'manage_structure'})
  ]);
  setCases(c.data||[]);setNotifications(n.data||[]);setMessages(m.data||[]);
  setCanAdmin(Boolean(admin.data));
 }
 async function reload(){await loadPublic();const {data:{user:u}}=await db.auth.getUser();await loadUser(u)}
 useEffect(()=>{
  let mounted=true;
  (async()=>{await loadPublic();const {data:{user:u}}=await db.auth.getUser();if(mounted)await loadUser(u)})();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(mounted){setUser(session?.user||null);}});
  const onPop=()=>{const path=window.location.pathname;
    if(path.startsWith('/thread/')){setView('thread');setActiveThread(path.slice(8))}
    else if(path==='/cases')setView('cases');
    else if(path==='/profile')setView('profile');
    else if(path==='/messages')setView('messages');
    else if(path==='/search')setView('search');else setView('home');
  };
  window.addEventListener('popstate',onPop);
  const p=window.location.pathname;
  if(p==='/cases')setView('cases');if(p==='/profile')setView('profile');if(p==='/messages')setView('messages');
  if(new URLSearchParams(window.location.search).has('auth'))setShowAuth(true);
  return()=>{mounted=false;subscription.unsubscribe();window.removeEventListener('popstate',onPop)}
 },[db]);
 useEffect(()=>{if(view!=='thread'||!activeThread)return;
  db.from('blezz_forum_posts').select('*').eq('thread_id',activeThread).order('created_at').then(({data})=>setPosts(data||[]));
 },[view,activeThread,db]);
 function go(v:View,id=''){setView(v);setError('');setInfo('');setMobileNav(false);setShowNotice(false);
  if(v==='category')setActiveCategory(id);if(v==='thread'){setActiveThread(id);setEditingThread(false)}
  const path=v==='thread'?'/thread/'+id:v==='home'?'/':v==='category'?'/':('/'+v);
  window.history.pushState({},'',path);window.scrollTo({top:0,behavior:'smooth'});
 }
 async function authSubmit(e:FormEvent){e.preventDefault();setBusy(true);setError('');
  try{
  if(register){
   const {error:e}=await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/auth/callback',data:{username:nickname}}});
   if(e)throw e;setShowAuth(false);okay('Регистрация отправлена. Проверьте электронную почту для подтверждения аккаунта.');
  }else{
   const {error:e}=await db.auth.signInWithPassword({email,password});if(e)throw e;
   setShowAuth(false);await reload();okay('Вы вошли в аккаунт.');
  }}catch(e){fail(e)}finally{setBusy(false)}
 }
 async function signOut(){await db.auth.signOut();await loadUser(null);okay('Вы вышли из аккаунта');go('home')}
 async function resetPassword(){if(!email)return fail('Укажите электронную почту');
  const {error:e}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/auth/callback'});
  if(e)fail(e);else okay('Ссылка восстановления отправлена на почту, если адрес зарегистрирован.');
 }
 function requireLogin(){if(user)return true;setShowAuth(true);return false}
 async function createThread(e:FormEvent){e.preventDefault();if(!requireLogin())return;
  setBusy(true);const {data,error:e}=await db.from('blezz_forum_threads').insert({category_id:activeCategory,author_id:user!.id,title:threadTitle.trim(),body:threadBody.trim()}).select('id').single();
  setBusy(false);if(e)return fail(e);setNewThread(false);setThreadTitle('');setThreadBody('');await loadPublic();go('thread',data.id);
 }
 async function saveEditedThread(){const {data,error:e}=await db.rpc('blezz_forum_edit_thread',{tid:activeThread,new_title:threadTitle,new_body:threadBody});
  if(e||!data)return fail(e||'Тема не изменена');setEditingThread(false);await loadPublic();okay('Тема обновлена');
 }
 async function createReply(e:FormEvent){e.preventDefault();if(!requireLogin()||!reply.trim())return;setBusy(true);
  const {error:e}=await db.from('blezz_forum_posts').insert({thread_id:activeThread,author_id:user!.id,body:reply.trim()});
  setBusy(false);if(e)return fail(e);setReply('');
  const {data}=await db.from('blezz_forum_posts').select('*').eq('thread_id',activeThread).order('created_at');setPosts(data||[]);okay('Ответ опубликован');
 }
 async function createCase(e:FormEvent){e.preventDefault();if(!requireLogin())return;setBusy(true);
  const {error:e}=await db.from('blezz_forum_cases').insert({user_id:user!.id,category:caseType,server_id:caseServer||null,applicant_nick:caseNick,subject_nick:caseSubject,description:caseDescription,evidence:caseEvidence,incident_on:caseDate||null});
  setBusy(false);if(e)return fail(e);setShowCaseForm(false);setCaseDescription('');setCaseEvidence('');await loadUser(user);okay('Обращение зарегистрировано. Оно получило уникальный номер.');
 }
 async function upload(file:File,cb:(url:string)=>void){if(!requireLogin())return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)return fail('Допустимы PNG, JPEG, WebP до 5 МБ');
  const ext=file.type.split('/')[1]==='jpeg'?'jpg':file.type.split('/')[1];
  const path=user!.id+'/'+crypto.randomUUID()+'.'+ext;setBusy(true);
  const {error:e}=await db.storage.from('blezz-forum-assets').upload(path,file,{upsert:false});
  setBusy(false);if(e)return fail(e);
  cb(db.storage.from('blezz-forum-assets').getPublicUrl(path).data.publicUrl);okay('Изображение загружено');
 }
 async function saveProfile(e:FormEvent){e.preventDefault();if(!user||!profile)return;setBusy(true);
  const {error:e}=await db.from('blezz_forum_profiles').update({username:profile.username,game_nick:profile.game_nick,game_server:profile.game_server||null,signature:profile.signature,about:profile.about,avatar_url:profile.avatar_url,cover_url:profile.cover_url}).eq('id',user.id);
  setBusy(false);if(e)return fail(e);await loadPublic();okay('Профиль сохранён');
 }
 async function searchThreads(e:FormEvent){e.preventDefault();const q=search.trim().slice(0,80);if(!q)return;
  const {data,error:e}=await db.from('blezz_forum_threads').select('*').ilike('title','%'+q+'%').limit(50);
  if(e)return fail(e);setSearchResults(data||[]);go('search');
 }
 async function reactToThread(emoji:string){if(!requireLogin())return;
  const {error:e}=await db.from('blezz_forum_reactions').upsert({thread_id:activeThread,user_id:user!.id,emoji});if(e)fail(e);else okay('Реакция сохранена');
 }
 async function subscribe(){if(!requireLogin())return;const {error:e}=await db.from('blezz_forum_subscriptions').upsert({thread_id:activeThread,user_id:user!.id});if(e)fail(e);else okay('Уведомления для темы включены')}
 async function sendMessage(e:FormEvent){e.preventDefault();if(!requireLogin())return;
  const recipient=profiles.find(p=>p.username.toLowerCase()===newMessageTo.trim().toLowerCase());
  if(!recipient)return fail('Пользователь с таким ником не найден');
  const {error:e2}=await db.from('blezz_forum_messages').insert({sender_id:user!.id,recipient_id:recipient.id,body:newMessageBody.trim()});
  if(e2)return fail(e2);setNewMessageBody('');await loadUser(user);okay('Сообщение отправлено');
 }
 async function markNotices(){if(!user)return;
  await db.from('blezz_forum_notifications').update({seen:true}).eq('user_id',user.id);
  setNotifications(notifications.map(n=>({...n,seen:true})));setShowNotice(false);
 }
 const active=threads.find(t=>t.id===activeThread);
 const cat=categories.find(c=>c.id===activeCategory);
 const names=Object.fromEntries(profiles.map(p=>[p.id,p.username]));
 const myRoles=user?memberships.filter(r=>r.user_id===user.id).map(m=>roles.find(r=>r.id===m.role_id)).filter(Boolean):[];
 const selectedSeason=actualSeason(theme);
 const unread=notifications.filter(n=>!n.seen).length;
 const threadList=(list:R[])=>list.length?<div className="thread-list">{list.map(t=><button key={t.id} className="thread-row" onClick={()=>go('thread',t.id)}>
  <span className="thread-avatar">{(names[t.author_id]||'B').slice(0,1).toUpperCase()}</span>
  <span className="thread-main"><span className="thread-name">{t.pinned&&<Pin size={14}/>} {t.title} {t.locked&&<Lock size={13}/>}</span><small>{names[t.author_id]||'Участник'} · {date(t.created_at)}</small></span>
  <span className={'tag status-'+t.status}>{threadStatus[t.status]||t.status}</span><ChevronRight size={16} className="muted"/></button>)}</div>:<div className="empty">Пока нет тем. Опубликуйте первую тему.</div>;
 return <div className="forum-shell"><SeasonEffects theme={theme}/>
 <header className="header"><div className="header-inner">
 <button className="brand" onClick={()=>go('home')}><span className="brand-emblem"><Gamepad2 size={25}/></span><span className="brand-text">BLEZZ <b>RUSSIA</b><small>ИГРОВОЕ СООБЩЕСТВО</small></span></button>
 <nav className={mobileNav?'nav open':'nav'}>
 <button className={view==='home'?'nav-active':''} onClick={()=>go('home')}><LayoutGrid size={16}/> Форум</button>
 <button className={view==='cases'?'nav-active':''} onClick={()=>go('cases')}><ShieldCheck size={16}/> Обращения</button>
 <button onClick={()=>{if(requireLogin())go('messages')}}><MessagesSquare size={16}/> Сообщения</button>
 {canAdmin&&<a href="/admin"><Settings2 size={16}/> Админ-панель</a>}
 </nav>
 <div className="header-actions"><button className="icon-btn search-btn" title="Поиск" onClick={()=>go('search')}><Search size={20}/></button>
 {user&&<div className="notification-wrap"><button className="icon-btn" title="Уведомления" onClick={()=>setShowNotice(!showNotice)}><Bell size={20}/>{unread>0&&<i className="counter">{unread}</i>}</button>
 {showNotice&&<div className="notice-menu"><strong>Уведомления</strong>{notifications.slice(0,10).map(n=><div key={n.id} className={n.seen?'notice-item':'notice-item unread'}>{n.message}<small>{date(n.created_at)}</small></div>)}{!notifications.length&&<p className="muted">Уведомлений нет</p>}<button className="btn subtle" onClick={markNotices}>Отметить прочитанными</button></div>}</div>}
 {user?<button className="user-button" onClick={()=>go('profile')}><UserRound size={17}/><span>{profile?.username||'Профиль'}</span></button>:<button className="btn primary small" onClick={()=>setShowAuth(true)}><LogIn size={16}/> Войти</button>}
 <button className="icon-btn mobile-toggle" onClick={()=>setMobileNav(!mobileNav)}>{mobileNav?<X/>:<Menu/>}</button></div></div></header>
 <main className="main">
 {error&&<div className="alert error"><AlertCircle size={17}/>{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}
 {info&&<div className="alert success"><CheckCircle2 size={17}/>{info}<button onClick={()=>setInfo('')}><X size={15}/></button></div>}
 {view==='home'&&<>
 <section className="hero" style={safeMediaUrl(theme.config.banner||'')?{backgroundImage:'linear-gradient(90deg,rgba(10,16,30,.93),rgba(12,17,28,.68)),url('+safeMediaUrl(theme.config.banner||'')+')'}:{}}>
  <div className="hero-content"><div className="eyebrow"><span className="dot"/> ОФИЦИАЛЬНЫЙ ФОРУМ · {seasonNames[selectedSeason].toUpperCase()} {new Date().getFullYear()}</div>
  <h1>{theme.config.title||'BLEZZ RUSSIA'}<span className="hero-stroke">.</span></h1>
  <p>{theme.config.tagline||'Центр игрового сообщества — обсуждай, участвуй, развивай проект.'}</p>
  <div className="hero-buttons"><button className="btn primary" onClick={()=>{if(requireLogin()){setNewThread(true);go('category',categories[0]?.id||'')}}}><Plus size={17}/> Создать тему</button><button className="btn glass" onClick={()=>go('cases')}><ShieldCheck size={18}/> Подать жалобу</button></div>
  </div><div className="hero-graphic"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><Gamepad2 size={104} strokeWidth={1.1}/></div>
 </section>
 <div className="stat-grid"><div className="stat-card"><Users size={20}/><div><strong>{profiles.length}</strong><small>Участников</small></div></div>
 <div className="stat-card"><BookOpen size={20}/><div><strong>{threads.length}</strong><small>Тем форума</small></div></div>
 <div className="stat-card"><MessagesSquare size={20}/><div><strong>{servers.length}</strong><small>Серверов</small></div></div>
 <div className="stat-card"><Flame size={20}/><div><strong>{threads.filter(t=>new Date(t.created_at).toDateString()===new Date().toDateString()).length}</strong><small>Тем сегодня</small></div></div></div>
 <div className="content-layout"><div className="main-column"><div className="section-heading"><div><span className="section-kicker">СТРУКТУРА СООБЩЕСТВА</span><h2>Разделы форума</h2></div><span className="muted">{categories.length} разделов</span></div>
 <div className="panel"><div className="panel-header"><LayoutGrid size={17}/> Общая информация <span className="panel-meta">BLEZZ RUSSIA</span></div>
 {categories.filter(c=>!c.server_id&&!c.parent_id).map(c=><button className="category-row" key={c.id} onClick={()=>go('category',c.id)}><span className="category-icon">{c.icon||'📁'}</span><span><strong>{c.name}</strong><small>{c.description}</small></span><span className="category-count">{threads.filter(t=>t.category_id===c.id).length} тем</span><ChevronRight size={17}/></button>)}</div>
 {servers.map(s=><div className="panel server-panel" key={s.id}><div className="panel-header"><Gamepad2 size={18}/>{s.name}<span className="panel-meta">{s.description}</span></div>
 {categories.filter(c=>c.server_id===s.id&&!c.parent_id).map(c=><button className="category-row" key={c.id} onClick={()=>go('category',c.id)}><span className="category-icon">{c.icon||'🎮'}</span><span><strong>{c.name}</strong><small>{c.description}</small></span><span className="category-count">{threads.filter(t=>t.category_id===c.id).length} тем</span><ChevronRight size={17}/></button>)}</div>)}
 </div><aside className="sidebar"><div className="side-card"><span className="section-kicker">НОВОСТИ И СОБЫТИЯ</span><h3>Последние новости</h3>
 {news.length?news.map(n=><div key={n.id} className="news-row"><span className="news-indicator"/><div><strong>{n.title}</strong><p>{n.body.slice(0,180)}</p><small>{date(n.created_at)}</small></div></div>):<div className="empty compact">Новости будут опубликованы администрацией.</div>}</div>
 <div className="side-card info-side"><ShieldCheck size={26}/><h3>Нужна помощь?</h3><p>Отправьте обращение, и ответственный сотрудник сможет принять решение и указать причину.</p><button className="btn outline full" onClick={()=>go('cases')}>Создать обращение <ChevronRight size={17}/></button></div>
 <div className="side-card"><span className="section-kicker">АКТИВНОСТЬ</span><h3>Новые обсуждения</h3>{threads.slice(0,5).map(t=><button className="small-thread" key={t.id} onClick={()=>go('thread',t.id)}>{t.title}<small>{date(t.created_at)}</small></button>)}</div>
 </aside></div></>}
 {view==='category'&&<><div className="crumbs"><button onClick={()=>go('home')}>Форум</button><ChevronRight size={14}/><span>{cat?.name}</span></div>
 <div className="page-header"><div><div className="section-kicker">РАЗДЕЛ ФОРУМА</div><h1>{cat?.icon} {cat?.name||'Раздел'}</h1><p>{cat?.description}</p></div><button className="btn primary" onClick={()=>{if(requireLogin())setNewThread(!newThread)}}><Plus size={17}/> Новая тема</button></div>
 {newThread&&<form className="panel form-panel" onSubmit={createThread}><h3>Создать тему</h3><label>Название темы<input value={threadTitle} required minLength={5} maxLength={160} onChange={e=>setThreadTitle(e.target.value)} placeholder="Заголовок обсуждения"/></label><label>Сообщение<textarea value={threadBody} required minLength={3} rows={7} maxLength={20000} onChange={e=>setThreadBody(e.target.value)} placeholder="Опишите ситуацию или задайте вопрос"/></label><div className="form-actions"><button className="btn primary" disabled={busy}>Опубликовать</button><button type="button" className="btn subtle" onClick={()=>setNewThread(false)}>Отмена</button></div></form>}
 <div className="panel"><div className="panel-header">Темы раздела <span className="panel-meta">{threads.filter(t=>t.category_id===activeCategory).length} тем</span></div>{threadList(threads.filter(t=>t.category_id===activeCategory).sort((a,b)=>Number(b.pinned)-Number(a.pinned)))}</div></>}
 {view==='thread'&&<><div className="crumbs"><button onClick={()=>go('home')}>Форум</button><ChevronRight size={14}/><button onClick={()=>go('category',active?.category_id||'')}>{categories.find(c=>c.id===active?.category_id)?.name||'Раздел'}</button><ChevronRight size={14}/><span>Тема</span></div>
 {active?<><div className="panel discussion"><div className="discussion-top"><div><span className={'tag status-'+active.status}>{threadStatus[active.status]||active.status}</span><h1>{active.title}</h1><p className="muted">{date(active.created_at)} · {names[active.author_id]||'Участник'}</p></div>{active.locked&&<span className="tag"><Lock size={13}/> Закрыто</span>}</div>
 <div className="post-block"><div className="author-block"><div className="avatar-lg">{(names[active.author_id]||'?').slice(0,1).toUpperCase()}</div><b>{names[active.author_id]||'Участник'}</b><small>Автор темы</small></div><div className="post-content"><div className="post-date">#1 · {date(active.created_at)}</div>{editingThread?<div className="inline-edit"><input value={threadTitle} onChange={e=>setThreadTitle(e.target.value)}/><textarea rows={10} value={threadBody} onChange={e=>setThreadBody(e.target.value)}/><button className="btn primary" onClick={saveEditedThread}>Сохранить</button><button className="btn subtle" onClick={()=>setEditingThread(false)}>Отмена</button></div>:<p className="body-text">{active.body}</p>}
 <div className="post-actions"><button onClick={()=>reactToThread('like')}><ThumbsUp size={16}/> Нравится</button><button onClick={()=>reactToThread('heart')}><Heart size={16}/> Сердце</button><button onClick={subscribe}><Bell size={16}/> Подписаться</button>
 {user?.id===active.author_id&&!active.locked&&<button onClick={()=>{setThreadTitle(active.title);setThreadBody(active.body);setEditingThread(true)}}><Settings2 size={16}/> Редактировать</button>}</div></div></div></div>
 <h3 className="reply-title">{posts.length} ответов</h3><div className="panel">{posts.length?posts.map((p,i)=><div className="post-block reply-block" key={p.id}><div className="author-block"><div className="avatar-lg small-av">{(names[p.author_id]||'?').slice(0,1).toUpperCase()}</div><b>{names[p.author_id]||'Участник'}</b></div><div className="post-content"><div className="post-date">#{i+2} · {date(p.created_at)}</div><p className="body-text">{p.body}</p><div className="post-actions"><button onClick={()=>setReply('> '+p.body.slice(0,250)+'\n\n')}><MessageSquare size={15}/> Цитировать</button></div></div></div>):<div className="empty">Ответов пока нет</div>}</div>
 {!active.locked?<form className="panel form-panel reply-form" onSubmit={createReply}><h3>Написать ответ</h3><textarea placeholder="Напишите ответ..." value={reply} minLength={1} rows={5} maxLength={20000} required onChange={e=>setReply(e.target.value)}/><button className="btn primary" disabled={busy}><Send size={16}/> Опубликовать ответ</button></form>:<div className="empty"><Lock size={19}/> Обсуждение закрыто администрацией</div>}
 </>:<div className="empty">Тема не найдена. <button className="text-button" onClick={()=>go('home')}>На главную</button></div>}</>}
 {view==='cases'&&<><div className="page-header"><div><div className="section-kicker">ЦЕНТР ОБРАЩЕНИЙ</div><h1>Жалобы и заявления</h1><p>Официальная подача и рассмотрение обращений BLEZZ RUSSIA</p></div><button className="btn primary" onClick={()=>{if(requireLogin())setShowCaseForm(!showCaseForm)}}><Plus size={17}/> Подать обращение</button></div>
 <div className="mini-card-row">{Object.entries(caseLabels).map(([k,v])=><button key={k} className="mini-case" onClick={()=>{if(requireLogin()){setCaseType(k);setShowCaseForm(true)}}}><FileWarning size={18}/><span>{v}</span><ChevronRight size={14}/></button>)}</div>
 {showCaseForm&&<form className="panel form-panel" onSubmit={createCase}><h3>Новое обращение</h3><div className="form-grid"><label>Тип обращения<select value={caseType} onChange={e=>setCaseType(e.target.value)}>{Object.entries(caseLabels).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Сервер<select value={caseServer} onChange={e=>setCaseServer(e.target.value)}><option value="">Не указан</option>{servers.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>Ваш игровой ник<input required value={caseNick} onChange={e=>setCaseNick(e.target.value)} placeholder="Name_Surname"/></label><label>Ник ответчика / должность<input value={caseSubject} onChange={e=>setCaseSubject(e.target.value)} placeholder="Ник игрока"/></label></div><label>Описание ситуации<textarea required minLength={10} rows={6} maxLength={10000} value={caseDescription} onChange={e=>setCaseDescription(e.target.value)} placeholder="Подробно опишите обстоятельства"/></label><div className="form-grid"><label>Доказательства / ссылки<input value={caseEvidence} onChange={e=>setCaseEvidence(e.target.value)} placeholder="https://..."/></label><label>Дата нарушения<input type="date" value={caseDate} onChange={e=>setCaseDate(e.target.value)}/></label></div><label className="upload-label"><Upload size={16}/> Прикрепить скриншот (до 5 МБ)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,setCaseEvidence)}}/></label><div className="form-actions"><button className="btn primary" disabled={busy}>Отправить обращение</button><button type="button" className="btn subtle" onClick={()=>setShowCaseForm(false)}>Отмена</button></div></form>}
 <div className="panel"><div className="panel-header"><Inbox size={17}/> Мои обращения <span className="panel-meta">{cases.length} записей</span></div>{!user?<div className="empty">Войдите, чтобы видеть историю обращений.</div>:cases.length?cases.map(c=><div className="case-row" key={c.id}><div><strong>#{c.id} · {caseLabels[c.category]}</strong><small>{c.applicant_nick} · {date(c.created_at)}</small><p>{c.description}</p>{c.decision&&<p className="case-decision">Решение: {c.decision}</p>}</div><span className={'tag status-'+c.status}>{caseStatus[c.status]||c.status}</span></div>):<div className="empty">Обращений пока нет</div>}</div></>}
 {view==='profile'&&<><div className="page-header"><div><div className="section-kicker">ЛИЧНЫЙ КАБИНЕТ</div><h1>Мой профиль</h1><p>Управление учётной записью и игровым профилем</p></div>{user&&<button className="btn subtle" onClick={signOut}><LogOut size={16}/> Выйти</button>}</div>
 {user&&profile?<div className="content-layout"><form className="panel form-panel main-column" onSubmit={saveProfile}><div className="profile-banner" style={safeMediaUrl(profile.cover_url||'')?{backgroundImage:'url('+safeMediaUrl(profile.cover_url)+')'}:{}}><div className="avatar-lg">{profile.avatar_url?<img src={safeMediaUrl(profile.avatar_url)} alt="Аватар"/>:profile.username?.slice(0,1)}</div></div><h3>{profile.username}</h3><p className="muted">Дата регистрации: {date(profile.created_at)}</p><div className="role-pills">{myRoles.map((r:R)=><span key={r.id} className="tag" style={{color:r.color}}>{r.name}</span>)}</div><div className="form-grid"><label>Ник на форуме<input required minLength={3} maxLength={32} value={profile.username||''} onChange={e=>setProfile({...profile,username:e.target.value})}/></label><label>Игровой ник<input value={profile.game_nick||''} onChange={e=>setProfile({...profile,game_nick:e.target.value})}/></label><label>Игровой сервер<select value={profile.game_server||''} onChange={e=>setProfile({...profile,game_server:e.target.value})}><option value="">Не выбран</option>{servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Аватар (URL)<input value={profile.avatar_url||''} onChange={e=>setProfile({...profile,avatar_url:e.target.value})}/></label></div><label className="upload-label"><Upload size={16}/> Загрузить аватар<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,url=>setProfile({...profile,avatar_url:url}))}}/></label><label>Обложка профиля (URL)<input value={profile.cover_url||''} onChange={e=>setProfile({...profile,cover_url:e.target.value})}/></label><label>О себе<textarea rows={4} value={profile.about||''} onChange={e=>setProfile({...profile,about:e.target.value})}/></label><label>Подпись<input value={profile.signature||''} onChange={e=>setProfile({...profile,signature:e.target.value})}/></label><button className="btn primary" disabled={busy}><Save size={16}/> Сохранить профиль</button></form><aside className="sidebar"><div className="side-card"><span className="section-kicker">МОЯ АКТИВНОСТЬ</span><h3>Статистика</h3><div className="fact"><span>Создано тем</span><b>{threads.filter(t=>t.author_id===user.id).length}</b></div><div className="fact"><span>Обращений</span><b>{cases.filter(c=>c.user_id===user.id).length}</b></div></div></aside></div>:<div className="empty"><button className="btn primary" onClick={()=>setShowAuth(true)}>Войти в аккаунт</button></div>}</>}
 {view==='messages'&&<><div className="page-header"><div><div className="section-kicker">ЛИЧНАЯ ПОЧТА</div><h1>Сообщения</h1><p>Личная переписка участников форума</p></div></div>
 {user?<div className="content-layout"><div className="main-column"><div className="panel">{messages.length?messages.map(m=><div className="message-row" key={m.id}><div className="avatar-sm">{(names[m.sender_id]||'?').slice(0,1)}</div><div><b>{names[m.sender_id]||'Участник'} → {names[m.recipient_id]||'Участник'}</b><p>{m.body}</p><small>{date(m.created_at)}</small></div></div>):<div className="empty">Переписок пока нет</div>}</div></div><aside className="sidebar"><form className="side-card" onSubmit={sendMessage}><h3>Новое сообщение</h3><label>Ник получателя<input value={newMessageTo} required onChange={e=>setNewMessageTo(e.target.value)} placeholder="Ник на форуме"/></label><label>Сообщение<textarea required minLength={1} rows={6} maxLength={5000} value={newMessageBody} onChange={e=>setNewMessageBody(e.target.value)}/></label><button className="btn primary full"><Send size={16}/> Отправить</button></form></aside></div>:<div className="empty">Войдите, чтобы читать сообщения</div>}</>}
 {view==='search'&&<><div className="page-header"><div><div className="section-kicker">ПОИСК ПО ФОРУМУ</div><h1>Найти обсуждение</h1></div></div><form className="search-box" onSubmit={searchThreads}><Search size={22}/><input autoFocus placeholder="Поиск темы по названию..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="btn primary">Поиск</button></form><div className="panel"><div className="panel-header">Результаты поиска <span className="panel-meta">{searchResults.length} тем</span></div>{threadList(searchResults)}</div></>}
 </main><footer className="footer"><div><span className="brand-footer">BLEZZ <b>RUSSIA</b></span><p>Игровое сообщество. Самостоятельный форум.</p></div><div>© {new Date().getFullYear()} BLEZZ RUSSIA · <button onClick={()=>go('home')}>На главную</button></div></footer>
 {showAuth&&<div className="modal-backdrop" onMouseDown={()=>setShowAuth(false)}><div className="modal auth-modal" onMouseDown={e=>e.stopPropagation()}><button className="close-modal" onClick={()=>setShowAuth(false)}><X size={19}/></button><div className="brand-emblem large-emblem"><Gamepad2 size={31}/></div><h2>{register?'Создать аккаунт':'Войти на форум'}</h2><p>{register?'Присоединяйтесь к игровому сообществу':'С возвращением в BLEZZ RUSSIA'}</p><form onSubmit={authSubmit}>{register&&<label>Никнейм<input required minLength={3} maxLength={24} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Ваш ник"/></label>}<label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label><label>Пароль<input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Не менее 6 символов"/></label><button className="btn primary full" disabled={busy}>{register?'Зарегистрироваться':'Войти'}</button></form><button className="auth-switch" onClick={()=>setRegister(!register)}>{register?'Уже есть аккаунт? Войти':'Нет аккаунта? Зарегистрироваться'}</button><button className="auth-switch muted" onClick={resetPassword}>Восстановить пароль</button></div></div>}
 </div>;
}
