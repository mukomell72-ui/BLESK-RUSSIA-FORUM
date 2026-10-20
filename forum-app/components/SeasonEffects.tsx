'use client';
import {useEffect,useMemo} from 'react';
import {actualSeason,palettes,ThemeRow,safeMediaUrl,configForSeason} from '@/lib/theme';
export default function SeasonEffects({theme,preview=false}:{theme:ThemeRow;preview?:boolean}){
 const season=actualSeason(theme);const cfg=configForSeason(theme);
 const count=cfg.effects===false?0:Math.min(65,Math.max(0,Math.round((cfg.intensity??35)*.48)));
 const flakes=useMemo(()=>Array.from({length:count},(_,i)=>{
  const seed=(i*53+17)%101;return {x:seed,delay:(i*19)%33,duration:Math.max(5,20-(cfg.speed??45)*.13)+(i%7),size:8+i%14};
 }),[count,cfg.speed]);
 useEffect(()=>{
  if(preview)return;
  document.documentElement.dataset.season=season;
  document.documentElement.style.setProperty('--accent',/^#[0-9a-fA-F]{6}$/.test(cfg.accent||'')?cfg.accent!:palettes[season]);
  document.documentElement.style.setProperty('--round',String(Math.max(6,Math.min(26,cfg.buttonRadius??13)))+'px');
  document.documentElement.style.setProperty('--season-bg',safeMediaUrl(cfg.background||'')?'url("'+safeMediaUrl(cfg.background||'')+'")':'none');
 },[season,cfg.accent,cfg.background,cfg.buttonRadius,preview]);
 return <div className={'weather weather-'+season+' '+(preview?'weather-preview':'')} aria-hidden="true">
 {flakes.map((s,i)=><span key={i} className="particle" style={{left:s.x+'%',animationDelay:'-'+s.delay+'s',animationDuration:s.duration+'s',fontSize:s.size+'px'}}>{season==='winter'?'❄':season==='autumn'?'🍂':season==='spring'?'✿':'✦'}</span>)}
 </div>;
}