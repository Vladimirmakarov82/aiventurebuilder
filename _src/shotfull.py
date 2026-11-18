import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for path,name in [('/ru/','ru'),('/','en')]:
      for w,h,tag in [(1440,900,'d'),(390,844,'m')]:
        pg=await b.new_page(viewport={'width':w,'height':h});errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://localhost:8811'+path,wait_until='networkidle')
        H=await pg.evaluate('document.body.scrollHeight')
        for y in range(0,H,700):
          await pg.evaluate(f'window.scrollTo(0,{y})');await pg.wait_for_timeout(250)
        await pg.evaluate('window.scrollTo(0,0)');await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'shots/full-{name}-{tag}.png',full_page=True)
        print(name,tag,H,errs);await pg.close()
    await b.close()
asyncio.run(main())
