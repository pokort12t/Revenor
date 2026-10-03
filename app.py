import sqlite3, os
from flask import Flask, jsonify, request, render_template, session
app=Flask(__name__); app.secret_key=os.getenv('SECRET_KEY','ravenor-dev')
DB='ravenor.db'; MAX=55; GOLD_MAX=2000000
N=['Вальден','Елдрія','Фростваль','Нордхейм','Альвенор','Тарвін','Вінтерхольд','Сноурен','Рейвенфорд','Вальдор','Естерваль','Брандор','Аркен','Морвейн','Торвен','Греймонт','Лорден','Кардор','Вестмар','Елмарк','Дорнваль','Равенмір','Хаймонт','Блеквуд','Стармонт','Ерваль','Таргон','Вальмер','Остервік','Голдрен','Кронваль','Дреймор','Арден','Фальмор','Морден','Сільвар','Грейваль','Варден','Естор','Дракнор','Терраваль','Бріарен','Кальдор','Олдрін','Рейнгард','Велмор','Торнхейм','Арвен','Мальдор','Скарен','Саутваль','Лорвейн','Феррон','Айронваль','Кастелор']

def con():
 c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; return c

def init():
 c=con(); c.executescript('''CREATE TABLE IF NOT EXISTS server(id INTEGER PRIMARY KEY,name TEXT,max_players INTEGER);CREATE TABLE IF NOT EXISTS player(id INTEGER PRIMARY KEY AUTOINCREMENT,tid TEXT UNIQUE,name TEXT,server INTEGER,region INTEGER,status TEXT,king INTEGER,gold INTEGER,food INTEGER,iron INTEGER,wood INTEGER,stone INTEGER,horses INTEGER,soldiers INTEGER,knights INTEGER,cavalry INTEGER,archers INTEGER,capital INTEGER,alive INTEGER);CREATE TABLE IF NOT EXISTS region(id INTEGER PRIMARY KEY,server INTEGER,name TEXT,lord INTEGER,kingdom INTEGER,capital INTEGER,farms INTEGER,mines INTEGER);CREATE TABLE IF NOT EXISTS settlement(id INTEGER PRIMARY KEY AUTOINCREMENT,region INTEGER,kind TEXT,name TEXT,people INTEGER,livestock INTEGER);CREATE TABLE IF NOT EXISTS war(id INTEGER PRIMARY KEY AUTOINCREMENT,server INTEGER,attacker INTEGER,defender INTEGER,status TEXT);CREATE TABLE IF NOT EXISTS oath(id INTEGER PRIMARY KEY AUTOINCREMENT,lord INTEGER,king INTEGER,active INTEGER);''')
 if c.execute('SELECT COUNT(*) FROM server').fetchone()[0]==0:
  c.execute('INSERT INTO server VALUES(1,\'Ravenor I\',55)')
  for i,n in enumerate(N,1):
   c.execute('INSERT INTO region VALUES(?,?,?,?,?,?,?,?)',(i,1,n,None,None,0,1,1)); c.execute('INSERT INTO settlement(region,kind,name,people,livestock) VALUES(?,?,?,?,?)',(i,'city',n+' Град',1000,100)); c.execute('INSERT INTO settlement(region,kind,name,people,livestock) VALUES(?,?,?,?,?)',(i,'village',n+' Село',300,60))
 c.commit(); c.close()
def me():
 tid=session.get('tid');
 if not tid:return None
 c=con(); p=c.execute('SELECT * FROM player WHERE tid=?',(tid,)).fetchone(); c.close(); return p
@app.get('/')
def home(): return render_template('index.html')
@app.post('/api/start')
def start():
 d=request.get_json() or {}; tid=str(d.get('telegram_id') or 'dev'); name=str(d.get('name') or 'Гравець')[:40]; c=con(); p=c.execute('SELECT * FROM player WHERE tid=?',(tid,)).fetchone()
 if p: session['tid']=tid;c.close();return jsonify(ok=True,player=dict(p))
 if c.execute('SELECT COUNT(*) FROM player WHERE server=1 AND alive=1').fetchone()[0]>=MAX:c.close();return jsonify(ok=False,error='Сервер 55/55'),409
 r=c.execute('SELECT id FROM region WHERE server=1 AND lord IS NULL ORDER BY id LIMIT 1').fetchone(); pid=c.execute('INSERT INTO player(tid,name,server,region,status,king,gold,food,iron,wood,stone,horses,soldiers,knights,cavalry,archers,alive) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(tid,name,1,r[0],'king' if c.execute('SELECT COUNT(*) FROM player').fetchone()[0]==0 else 'lord',None,1000,500,100,100,100,20,10,2,2,4,1)).lastrowid; c.execute('UPDATE region SET lord=?,kingdom=? WHERE id=?',(pid,pid if pid==1 else None,r[0]));c.commit();p=c.execute('SELECT * FROM player WHERE id=?',(pid,)).fetchone();session['tid']=tid;c.close();return jsonify(ok=True,player=dict(p))
@app.get('/api/server')
def server():
 c=con(); p=c.execute('SELECT COUNT(*) n FROM player WHERE server=1 AND alive=1').fetchone()['n']; rs=[dict(x) for x in c.execute('SELECT id,name,lord,kingdom,capital FROM region ORDER BY id')];c.close();return jsonify(name='Ravenor I',players=p,max_players=55,regions=rs)
@app.get('/api/me')
def getme():
 p=me();return jsonify(ok=bool(p),player=dict(p) if p else None)
@app.get('/api/region/<int:i>')
def region(i):
 p=me();c=con();r=c.execute('SELECT * FROM region WHERE id=?',(i,)).fetchone();s=[dict(x) for x in c.execute('SELECT * FROM settlement WHERE region=?',(i,))];c.close();return jsonify(region=dict(r),settlements=s)
@app.get('/api/army')
def army():
 p=me();return jsonify(soldiers=[p['soldiers'],3,2],knights=[p['knights'],10,4],cavalry=[p['cavalry'],6,6],archers=[p['archers'],2,3],siege=['Таран','Облогова драбина','Катапульта'])
@app.post('/api/develop')
def develop():
 p=me();c=con();r=c.execute('SELECT * FROM region WHERE id=? AND lord=?',(p['region'],p['id'])).fetchone();
 if not r:return jsonify(ok=False,error='Не твоє володіння'),403
 if p['gold']<500:return jsonify(ok=False,error='Недостатньо золота'),400
 c.execute('UPDATE player SET gold=gold-500,food=food+100,iron=iron+20,wood=wood+30,stone=stone+20 WHERE id=?',(p['id'],));c.execute('UPDATE region SET farms=farms+1,mines=mines+1 WHERE id=?',(r['id'],));c.commit();c.close();return jsonify(ok=True)
@app.post('/api/capital')
def capital():
 p=me();c=con();c.execute('UPDATE region SET capital=0 WHERE kingdom=?',(p['id'],));c.execute('UPDATE region SET capital=1 WHERE id=? AND lord=?',(p['region'],p['id']));c.execute('UPDATE player SET capital=? WHERE id=?',(p['region'],p['id']));c.commit();c.close();return jsonify(ok=True)
@app.post('/api/war/<int:target>')
def war(target):
 p=me();c=con();d=c.execute('SELECT id FROM player WHERE id=? AND server=1 AND alive=1',(target,)).fetchone();
 if not d:return jsonify(ok=False,error='Гравця не знайдено'),404
 c.execute('INSERT INTO war(server,attacker,defender,status) VALUES(?,?,?,?,?)'.replace('VALUES(?,?,?,?,?)','VALUES(?,?,?,?)'),(1,p['id'],target,'active'));c.commit();c.close();return jsonify(ok=True)
@app.post('/api/oath/<int:k>')
def oath(k):
 p=me();c=con();x=c.execute("SELECT id FROM player WHERE id=? AND status='king' AND alive=1",(k,)).fetchone();
 if not x:return jsonify(ok=False,error='Короля не знайдено'),404
 c.execute('UPDATE oath SET active=0 WHERE lord=?',(p['id'],));c.execute('INSERT INTO oath(lord,king,active) VALUES(?,?,1)',(p['id'],k));c.execute('UPDATE player SET king=? WHERE id=?',(k,p['id']));c.commit();c.close();return jsonify(ok=True)
@app.post('/api/rebel')
def rebel():
 p=me();return jsonify(ok=p and p['status']=='lord',message='Повстання оголошено')
init()
if __name__=='__main__':app.run('0.0.0.0',5000,debug=True)
