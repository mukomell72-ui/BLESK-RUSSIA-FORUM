export type Season='autumn'|'winter'|'spring'|'summer'|'custom';
export type ThemeConfig={intensity?:number;speed?:number;effects?:boolean;scope?:string;accent?:string;background?:string;logo?:string;banner?:string;title?:string;tagline?:string;buttonRadius?:number};
export type ThemeRow={season:Season;auto_schedule:boolean;config:ThemeConfig;schedule:Record<string,string>;revision:number};
export const defaultTheme:ThemeRow={season:'autumn',auto_schedule:false,config:{intensity:35,speed:45,effects:true,scope:'global',accent:'#e8a04b',title:'BLEZZ RUSSIA',tagline:'Форум игрового сообщества'},schedule:{autumn:'09-01',winter:'12-01',spring:'03-01',summer:'06-01'},revision:1};
export function actualSeason(t:ThemeRow,date=new Date()):Season{
 if(!t.auto_schedule)return t.season;
 const yearDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Oslo',month:'2-digit',day:'2-digit'}).format(date);
 const pair=yearDate.split(/[-/]/);const md=pair.slice(-2).join('-');
 let active:Season='winter';let best='';
 for(const s of ['winter','spring','summer','autumn'] as Season[]){
 const start=t.schedule[s];if(/^\d\d-\d\d$/.test(start||'')&&start<=md&&start>=best){best=start;active=s}
 }
 if(!best){const ordered=Object.entries(t.schedule).filter(([s,v])=>s!=='custom'&&/^\d\d-\d\d$/.test(v)).sort((a,b)=>b[1].localeCompare(a[1]));if(ordered[0])active=ordered[0][0] as Season}
 return active;
}
export const seasonNames:Record<Season,string>={autumn:'Осень',winter:'Зима',spring:'Весна',summer:'Лето',custom:'Своя тема'};
export const palettes:Record<Season,string>={autumn:'#e8a04b',winter:'#68bee9',spring:'#79c9a2',summer:'#edb35b',custom:'#a9a4fd'};
export function safeMediaUrl(v:string){try{const u=new URL(v);return u.protocol==='https:'?u.toString():''}catch{return ''}}
