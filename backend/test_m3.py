import http.cookiejar, urllib.request, urllib.error, json, uuid, time, threading
from datetime import datetime, timedelta

def make_jar(): return http.cookiejar.CookieJar()
def get_csrf(jar):
    for c in jar:
        if c.name=='csrf_token': return c.value
    return ''
def req(jar, method, path, body=None):
    url='http://localhost:8080'+path
    headers={}
    data=None
    if body is not None:
        data=json.dumps(body).encode()
        headers['Content-Type']='application/json'
    csrf=get_csrf(jar)
    if method in ('POST','PATCH','PUT','DELETE') and csrf:
        headers['X-CSRF-Token']=csrf
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    r=urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with opener.open(r) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def login(jar,email,pwd):
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        with opener.open(urllib.request.Request('http://localhost:8080/api/v1/auth/csrf')): pass
    except: pass
    code,txt=req(jar,'POST','/api/v1/auth/login',{'email':email,'password':pwd})
    print(f'login {email} {code}')
    return jar

admin_jar=make_jar()
owner_jar=make_jar()
tenant_jar=make_jar()
tenant2_jar=make_jar()

admin_jar=login(admin_jar,'admin@kostify.local','Admin123!')
owner_jar=login(owner_jar,'owner@test.local','Password123')
# ensure tenant
for email,name in [('siti@test.local','Siti'),('andi@test.local','Andi')]:
    code,_=req(make_jar(),'POST','/api/v1/auth/register',{'name':name,'email':email,'password':'Password123','role':'tenant'})
    print(f'register {email} {code}')
tenant_jar=login(tenant_jar,'siti@test.local','Password123')
tenant2_jar=login(tenant2_jar,'andi@test.local','Password123')

# Setup kost
code,txt=req(owner_jar,'POST','/api/v1/owner/kosts',{'name':'Kost M3','city':'Jakarta','gender':'campur','address':'Jl M3','description':'test','facilities':['wifi'],'photos':[]})
print('create kost',code,txt[:200])
kost_id=json.loads(txt)['data']['id'] if code==201 else None
code,txt=req(admin_jar,'PATCH',f'/api/v1/admin/kosts/{kost_id}/verify')
print('verify',code)
# create rooms
rooms=[]
for num,price in [('R101',1200000),('R102',1500000),('R103',1800000)]:
    code,txt=req(owner_jar,'POST',f'/api/v1/owner/kosts/{kost_id}/rooms',{'room_number':num,'price_monthly':price})
    print(f'room {num} {code}')
    if code==201: rooms.append(json.loads(txt)['data'])
room_ids=[r['id'] for r in rooms]
print('room_ids',room_ids)

# 1 tenant book R101
code,txt=req(tenant_jar,'POST','/api/v1/bookings',{'room_id':room_ids[0]})
print('1 book R101 tenant1',code,txt[:300])
book1_id=json.loads(txt)['data']['id'] if code==201 else None
# check room reserved
code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
print('1b rooms after book',txt[:400])

# 2 duplicate booking same room by tenant2 -> 409
code,txt=req(tenant2_jar,'POST','/api/v1/bookings',{'room_id':room_ids[0]})
print('2 duplicate expect 409',code,txt[:200])

# 2b owner cannot book -> 403
code,txt=req(owner_jar,'POST','/api/v1/bookings',{'room_id':room_ids[1]})
print('2b owner book expect 403',code,txt[:150])

# 3 tenant list own bookings
code,txt=req(tenant_jar,'GET','/api/v1/bookings/me')
print('3 list tenant',code,txt[:400])

# 4 owner list pending
code,txt=req(owner_jar,'GET','/api/v1/owner/bookings?status=pending')
print('4 owner pending',code,txt[:400])

# 5 concurrent booking on R102 (available) by two tenants at same time
results={}
def concurrent_book(jar, room_id, key):
    c,t=req(jar,'POST','/api/v1/bookings',{'room_id':room_id})
    results[key]=(c,t)
t1=threading.Thread(target=concurrent_book,args=(tenant_jar,room_ids[1],'a'))
t2=threading.Thread(target=concurrent_book,args=(tenant2_jar,room_ids[1],'b'))
t1.start(); t2.start(); t1.join(); t2.join()
print('5 concurrent R102',results)
# one should be 201, one 409
codes=sorted([v[0] for v in results.values()])
print('  sorted codes',codes, 'pass' if codes==[201,409] or codes==[409,201] else 'FAIL')

# Determine which succeeded
concurrent_success_id=None
for k,(c,t) in results.items():
    if c==201: concurrent_success_id=json.loads(t)['data']['id']

# 6 cancel by owner of that concurrent booking? No, tenant cancels own.
# Let's cancel book1 by tenant1
if book1_id:
    code,txt=req(tenant_jar,'PATCH',f'/api/v1/bookings/{book1_id}/cancel')
    print('6 cancel book1',code,txt[:300])
    code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
    print('6b room available after cancel', 'available' in txt)

# 7 approve: tenant books again R101, owner approves
code,txt=req(tenant_jar,'POST','/api/v1/bookings',{'room_id':room_ids[0]})
print('7 book again R101',code,txt[:300])
book_approve_id=json.loads(txt)['data']['id'] if code==201 else None
start=(datetime.now()+timedelta(days=1)).strftime('%Y-%m-%d')
code,txt=req(owner_jar,'PATCH',f'/api/v1/owner/bookings/{book_approve_id}/approve',{'start_date':start,'duration_months':3})
print('7 approve',code,txt[:500])
contract_id=json.loads(txt)['data']['id'] if code==200 else None
# check room occupied
code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
print('7b room occupied?',txt.count('occupied'))

# 8 try book occupied room -> 409
code,txt=req(tenant2_jar,'POST','/api/v1/bookings',{'room_id':room_ids[0]})
print('8 book occupied expect 409',code,txt[:200])

# 9 reject: create booking on R103 then reject
code,txt=req(tenant2_jar,'POST','/api/v1/bookings',{'room_id':room_ids[2]})
print('9 book R103',code,txt[:300])
book_reject_id=json.loads(txt)['data']['id'] if code==201 else None
if book_reject_id:
    code,txt=req(owner_jar,'PATCH',f'/api/v1/owner/bookings/{book_reject_id}/reject',{'reason':'Survey gagal, tidak cocok'})
    print('9 reject',code,txt[:300])
    code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
    print('9b room available after reject',txt.count('available'))

# 10 expiry: create booking then force expire via DB and run worker SQL
# Create fresh room for expiry test
code,txt=req(owner_jar,'POST',f'/api/v1/owner/kosts/{kost_id}/rooms',{'room_number':'R104','price_monthly':1000000})
print('10 create R104',code)
r104_id=json.loads(txt)['data']['id'] if code==201 else None
code,txt=req(tenant_jar,'POST','/api/v1/bookings',{'room_id':r104_id})
print('10 book R104',code,txt[:300])
expiry_book_id=json.loads(txt)['data']['id'] if code==201 else None
if expiry_book_id:
    # force expires_at to past via DB
    import subprocess, textwrap
    # Use docker exec to run psql update
    import os
    os.system(f'docker compose exec db psql -U kostify -d kostify -c "UPDATE bookings SET expires_at = now() - interval \'1 hour\' WHERE id = \'{expiry_book_id}\';" > /dev/null 2>&1')
    # run expiry SQL directly (simulate worker)
    os.system('docker compose exec db psql -U kostify -d kostify -c "WITH expired AS (UPDATE bookings SET status = \'expired\', updated_at = now() WHERE status = \'pending\' AND expires_at <= now() RETURNING room_id), freed AS (UPDATE rooms r SET status = \'available\', updated_at = now() FROM expired e WHERE r.id = e.room_id AND r.status = \'reserved\' RETURNING 1) SELECT count(*) FROM freed;" > /dev/null 2>&1')
    # verify
    code,txt=req(owner_jar,'GET','/api/v1/owner/bookings?status=expired')
    print('10 expiry check',code,txt[:400])
    code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
    print('10 room R104 available?', 'R104' in txt and 'available' in txt)

# 11 end contract
if contract_id:
    code,txt=req(owner_jar,'PATCH',f'/api/v1/owner/contracts/{contract_id}/end')
    print('11 end contract',code,txt[:400])
    code,txt=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
    print('11 room R101 available after end',txt.count('available'))

# 12 stats
code,txt=req(owner_jar,'GET','/api/v1/owner/stats')
print('12 stats',code,txt[:500])

# 13 tenant contracts
code,txt=req(tenant_jar,'GET','/api/v1/contracts/me')
print('13 tenant contracts',code,txt[:400])
code,txt=req(owner_jar,'GET','/api/v1/owner/contracts')
print('13b owner contracts',code,txt[:500])

print('DONE M3')
