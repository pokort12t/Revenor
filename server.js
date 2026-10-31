const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express(); const server = http.createServer(app); const io = new Server(server);
app.use(express.static(path.join(__dirname)));
app.get('/health',(_,res)=>res.json({ok:true}));
const rooms = new Map();
const catastrophes = [
['Падіння астероїда','Удар знищив великі міста. Повітря забруднене, а пил може закрити сонце на роки.'],
['Зомбі-вірус','Невідомий вірус перетворює заражених на агресивних істот. Виходити назовні небезпечно.'],
['Ядерна війна','Після ядерних ударів поверхня забруднена радіацією. Вода та фільтри мають вирішальне значення.'],
['Смертельна пандемія','Новий вірус швидко поширюється. Бункеру потрібні карантин і медичні запаси.'],
['Всесвітній потоп','Рівень води стрімко зростає. Бункер розташований високо, але запаси обмежені.'],
['Виверження супервулкана','Попіл закриває небо, врожай гине, а повітряні фільтри швидко забиваються.'],
['Повстання штучного інтелекту','Автоматизовані системи вийшли з-під контролю. Електроенергія та зв’язок нестабільні.'],
['Глобальне похолодання','Температура різко впала. Без опалення та ізоляції люди не виживуть на поверхні.'],
['Суперпосуха','Річки пересохли, врожаї загинули. Прісна вода стала найціннішим ресурсом.'],
['Падіння метеоритного дощу','Численні метеорити пошкодили інфраструктуру, а пожежі охопили великі території.'],
['Токсичний туман','Невідома хімічна речовина накрила міста. Потрібні герметичні приміщення та справні фільтри.'],
['Глобальна кібератака','Енергомережі, зв’язок і системи постачання зупинилися. Електроніка працює нестабільно.'],
['Нашестя гігантських комах','Агресивні комахи швидко розмножуються та знищують запаси їжі на поверхні.'],
['Руйнування озонового шару','Небезпечне ультрафіолетове випромінювання робить перебування надворі смертельно ризикованим.'],
['Вічна буря','Потужні урагани й блискавки руйнують будівлі та унеможливлюють безпечні подорожі.'],
['Зникнення врожаїв','Хвороба рослин знищила більшість продовольчих культур. Потрібні насіння та контрольоване вирощування.']
];
const jobs=['лікар','інженер','фермер','кухар','електрик','вчитель','військовий','програміст','механік','біолог','будівельник','психолог'];
const hobbies=['садівництво','рибальство','ремонт техніки','медицина','плавання','готування','туризм','робототехніка','полювання','читання'];
const traits=['спокійний','лідерський','підозрілий','доброзичливий','імпульсивний','кмітливий','замкнутий','відважний'];
const bags=['аптечка','ніж і кресало','запас консервів','фільтр для води','рація','ліхтар і батарейки','інструменти','насіння рослин','мотузка та карабіни','протигаз'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function character(){return 'Вік: '+(18+Math.floor(Math.random()*53))+' років\nПрофесія: '+pick(jobs)+'\nХобі: '+pick(hobbies)+'\nХарактер: '+pick(traits)+'\nРюкзак: '+pick(bags)+'\nТаємний факт: '+pick(['має прихований запас їжі','боїться темряви','колись працював у лабораторії','вміє лагодити радіо','не довіряє незнайомцям','знає маршрут до старого сховища'])}
function publicState(room,sid){return {code:room.code,hostId:room.hostId,meId:sid,maxPlayers:room.maxPlayers,capacity:room.capacity,players:[...room.players.values()].map(p=>({id:p.id,name:p.name,eliminated:p.eliminated,character:p.character})),phase:room.phase,catastrophe:room.catastrophe,status:room.status,myVote:room.votes.has(sid),round:room.round,isHost:room.hostId===sid};}
function broadcast(room){for(const p of room.players.values())io.to(p.id).emit('state',publicState(room,p.id))}
function response(socket,room,cb){if(cb)cb({ok:true,state:publicState(room,socket.id)})}
function roomFor(socket){const code=socket.data.room;return code&&rooms.get(code)}
function codeGen(){let c;do{c=String(Math.floor(100000+Math.random()*900000))}while(rooms.has(c));return c}
io.on('connection',socket=>{
socket.on('createRoom',(d,cb)=>{const name=String(d.name||'').trim().slice(0,20);const maxPlayers=Math.max(4,Math.min(20,Number(d.maxPlayers)||4));const capacity=Math.max(1,Math.min(maxPlayers-1,Number(d.capacity)||1));if(!name)return cb?.({ok:false,error:'Введи ім’я.'});const code=codeGen();const room={code,hostId:socket.id,maxPlayers,capacity,players:new Map(),phase:'lobby',catastrophe:'',status:'Очікуємо на гравців.',votes:new Map(),round:0};room.players.set(socket.id,{id:socket.id,name,eliminated:false,character:''});rooms.set(code,room);socket.data.room=code;response(socket,room,cb);broadcast(room)});
socket.on('joinRoom',(d,cb)=>{const name=String(d.name||'').trim().slice(0,20),code=String(d.code||'').replace(/\\D/g,'').trim();const room=rooms.get(code);if(!name)return cb?.({ok:false,error:'Введи ім’я.'});if(!room){console.log('Join failed: room not found',code,'active rooms:',[...rooms.keys()]);return cb?.({ok:false,error:'Кімнату з таким кодом не знайдено. Переконайся, що ви відкрили однакове посилання гри, а ведучий ще перебуває в кімнаті. Якщо так — створи нову кімнату й спробуйте ще раз.'});}if(room.phase!=='lobby')return cb?.({ok:false,error:'Гра вже почалася.'});if(room.players.size>=room.maxPlayers)return cb?.({ok:false,error:'У кімнаті немає вільних місць.'});room.players.set(socket.id,{id:socket.id,name,eliminated:false,character:''});socket.data.room=code;response(socket,room,cb);broadcast(room)});
socket.on('startGame',(d,cb)=>{const r=roomFor(socket);if(!r||r.hostId!==socket.id)return cb?.({ok:false,error:'Тільки ведучий може почати гру.'});if(r.players.size<4)return cb?.({ok:false,error:'Потрібно щонайменше 4 гравці.'});if(r.players.size!==r.maxPlayers)return cb?.({ok:false,error:'Дочекайся всіх гравців.'});const c=pick(catastrophes);r.catastrophe=c[0]+'\n\n'+c[1];r.players.forEach(p=>p.character=character());r.phase='voting';r.round=1;r.votes.clear();r.status='Раунд 1. Обговоріть персонажів і проголосуйте, кого виключити.';broadcast(r);cb?.({ok:true})});
socket.on('vote',(d,cb)=>{const r=roomFor(socket);if(!r||r.phase!=='voting')return cb?.({ok:false,error:'Зараз голосування недоступне.'});const voter=r.players.get(socket.id),target=r.players.get(d.targetId);if(!voter||voter.eliminated)return cb?.({ok:false,error:'Ти більше не можеш голосувати.'});if(!target||target.eliminated||target.id===socket.id)return cb?.({ok:false,error:'Обери доступного іншого гравця.'});if(r.votes.has(socket.id))return cb?.({ok:false,error:'Ти вже проголосував.'});r.votes.set(socket.id,target.id);if(r.votes.size>= [...r.players.values()].filter(p=>!p.eliminated).length){const tally={};for(const id of r.votes.values())tally[id]=(tally[id]||0)+1;const max=Math.max(...Object.values(tally));const tied=Object.keys(tally).filter(id=>tally[id]===max);const kicked=pick(tied);r.players.get(kicked).eliminated=true;r.status='Голосування завершено. Виключено: '+r.players.get(kicked).name+'. Місць у бункері: '+r.capacity+'.';r.votes.clear();r.round++;if([...r.players.values()].filter(p=>!p.eliminated).length<=r.capacity){r.phase='finished';r.status+=' Переможці: '+[...r.players.values()].filter(p=>!p.eliminated).map(p=>p.name).join(', ')+'. Гру завершено!'}else r.phase='roundEnd';}else r.status='Проголосувало: '+r.votes.size+'. Очікуємо інших.';broadcast(r);cb?.({ok:true})});
socket.on('nextRound',(d,cb)=>{const r=roomFor(socket);if(!r||r.hostId!==socket.id)return cb?.({ok:false,error:'Тільки ведучий може продовжити.'});if(r.phase!=='roundEnd')return cb?.({ok:false,error:'Зараз не можна почати наступний раунд.'});r.phase='voting';r.votes.clear();r.status='Раунд '+r.round+'. Обговоріть і проголосуйте.';broadcast(r);cb?.({ok:true})});
socket.on('kick',(d,cb)=>{const r=roomFor(socket);if(!r||r.hostId!==socket.id)return cb?.({ok:false,error:'Тільки ведучий може виганяти гравців.'});if(d.targetId===r.hostId)return cb?.({ok:false,error:'Не можна вигнати самого себе.'});const p=r.players.get(d.targetId);if(!p)return cb?.({ok:false,error:'Гравця не знайдено.'});io.to(p.id).emit('kicked');io.sockets.sockets.get(p.id)?.leave(r.code);r.players.delete(p.id);r.votes.delete(p.id);for(const [v,t] of r.votes)if(t===p.id)r.votes.delete(v);if(r.players.size===0)rooms.delete(r.code);else{if(r.hostId===p.id)r.hostId=[...r.players.keys()][0];broadcast(r)}cb?.({ok:true})});
socket.on('leaveRoom',()=>leave(socket));
socket.on('disconnect',()=>leave(socket));
function leave(s){const r=roomFor(s);if(!r)return;r.players.delete(s.id);r.votes.delete(s.id);for(const [v,t] of r.votes)if(t===s.id)r.votes.delete(v);if(!r.players.size)rooms.delete(r.code);else{if(r.hostId===s.id)r.hostId=[...r.players.keys()][0];broadcast(r)}s.data.room=null}
});
const PORT=process.env.PORT||3000;server.listen(PORT,()=>console.log('Bunker server listening on '+PORT));
