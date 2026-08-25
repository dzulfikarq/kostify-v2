import http.cookiejar, urllib.request, urllib.error, json, uuid, base64

def make_jar(): return http.cookiejar.CookieJar()
def get_csrf(jar):
    for c in jar:
        if c.name=='csrf_token': return c.value
    return ''
def req(jar, method, path, body=None, use_csrf=True):
    url='http://localhost:8080'+path
    headers={}
    data=None
    if body is not None:
        data=json.dumps(body).encode()
        headers['Content-Type']='application/json'
    csrf=get_csrf(jar)
    if use_csrf and method in ('POST','PATCH','PUT','DELETE') and csrf:
        headers['X-CSRF-Token']=csrf
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    r=urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with opener.open(r) as resp:
            return resp.status, resp.read().decode(), jar
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), jar

def req_with_headers(jar, method, path, body_bytes, extra_headers):
    url='http://localhost:8080'+path
    headers=dict(extra_headers)
    csrf=get_csrf(jar)
    if csrf: headers['X-CSRF-Token']=csrf
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    r=urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
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
    code,txt,_=req(jar,'POST','/api/v1/auth/login',{'email':email,'password':pwd})
    print(f'login {email} {code} {txt[:150]}')
    return jar

admin_jar=make_jar()
owner_jar=make_jar()
tenant_jar=make_jar()

admin_jar=login(admin_jar,'admin@kostify.local','Admin123!')
owner_jar=login(owner_jar,'owner@test.local','Password123')
_,_,_=req(make_jar(),'POST','/api/v1/auth/register',{'name':'Siti','email':'siti@test.local','password':'Password123','role':'tenant'})
tenant_jar=login(tenant_jar,'siti@test.local','Password123')

code,txt,_=req(make_jar(),'GET','/api/v1/kosts')
print('1 public before',code,txt[:300])

code,txt,_=req(owner_jar,'POST','/api/v1/owner/kosts',{'name':'Kost Bahagia','city':'Jakarta','gender':'campur','address':'Jl. Merdeka 123','description':'Kost nyaman dekat kampus','facilities':['wifi','ac'],'photos':[]})
print('2 create kost',code,txt[:500])
kost_id=json.loads(txt)['data']['id'] if code==201 else None
print('  kost_id',kost_id)

code,txt,_=req(owner_jar,'POST','/api/v1/owner/kosts',{'name':'Kost Damai','city':'Bandung','gender':'putri','address':'Jl. Damai 45','description':'Kost putri','facilities':['wifi'],'photos':[]})
print('2b second kost',code,txt[:200])
kost2_id=json.loads(txt)['data']['id'] if code==201 else None

code,txt,_=req(owner_jar,'POST','/api/v1/owner/kosts',{'name':'Bad','city':'Jakarta','gender':'alien'})
print('3 bad gender expect 422',code,txt[:200])

code,txt,_=req(make_jar(),'GET','/api/v1/kosts')
print('4 public after create (pending hidden)',code,txt[:300])

code,txt,_=req(tenant_jar,'POST','/api/v1/owner/kosts',{'name':'Hack','city':'Jakarta'})
print('5 tenant create kost expect 403',code,txt[:150])

code,txt,_=req(admin_jar,'GET','/api/v1/admin/kosts?status=pending')
print('6 admin pending',code,txt[:500])

code,txt,_=req(admin_jar,'PATCH',f'/api/v1/admin/kosts/{kost_id}/verify')
print('7 verify',code,txt[:300])

code,txt,_=req(make_jar(),'GET','/api/v1/kosts')
print('8 public after verify',code,txt[:500])
code,txt,_=req(make_jar(),'GET',f'/api/v1/kosts/{kost_id}')
print('8b public get verified',code,txt[:400])

for num, price in [('A101',1500000),('A102',1800000)]:
    code,txt,_=req(owner_jar,'POST',f'/api/v1/owner/kosts/{kost_id}/rooms',{'room_number':num,'price_monthly':price,'facilities':['ac']})
    print(f'9 room {num} {code}',txt[:300])

code,txt,_=req(owner_jar,'POST',f'/api/v1/owner/kosts/{kost_id}/rooms',{'room_number':'A101','price_monthly':1500000})
print('9 dup room expect 409',code,txt[:200])

code,txt,_=req(owner_jar,'GET',f'/api/v1/owner/kosts/{kost_id}/rooms')
print('10 list rooms',code,txt[:500])
rooms=json.loads(txt)['data'] if code==200 else []
room_id=rooms[0]['id'] if rooms else None

code,txt,_=req(make_jar(),'GET','/api/v1/kosts?limit=1&page=1')
print('11 pagin limit1',code,txt[:400])
code,txt,_=req(make_jar(),'GET','/api/v1/kosts?limit=1&page=2')
print('11 pagin page2',code,txt[:400])

code,txt,_=req(make_jar(),'GET','/api/v1/kosts?city=Bandung')
print('12 filter city Bandung',code,txt[:400])

code,txt,_=req(make_jar(),'GET','/api/v1/kosts?min_price=1600000')
print('13 min_price filter',code,txt[:400])

code,txt,_=req(make_jar(),'GET','/api/v1/kosts?search=Bahagia')
print('14 search Bahagia',code,txt[:400])

if room_id:
    code,txt,_=req(owner_jar,'PATCH',f'/api/v1/owner/rooms/{room_id}',{'status':'maintenance'})
    print('15 to maintenance (from available ok)',code,txt[:300])
    code,txt,_=req(owner_jar,'PATCH',f'/api/v1/owner/rooms/{room_id}',{'status':'available'})
    print('15b back to available',code,txt[:300])
    code,txt,_=req(owner_jar,'DELETE',f'/api/v1/owner/rooms/{room_id}')
    print('15c delete available',code,txt[:200])

png_b64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
png_bytes=base64.b64decode(png_b64)
boundary='----Boundary'+uuid.uuid4().hex
hdr = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
footer = f'\r\n--{boundary}--\r\n'.encode()
body = hdr + png_bytes + footer
headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Content-Length': str(len(body))}
code,txt=req_with_headers(owner_jar,'POST','/api/v1/uploads/images',body,headers)
print('16 upload png',code,txt[:500])
txt_body=b'hello world'
hdr2 = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\n'.encode()
body2 = hdr2 + txt_body + footer
headers2={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Content-Length': str(len(body2))}
code,txt=req_with_headers(owner_jar,'POST','/api/v1/uploads/images',body2,headers2)
print('16b upload txt expect 422',code,txt[:300])
print('DONE M2')
