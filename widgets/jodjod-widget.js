// JodJod widget สำหรับแอป Scriptable บน iPhone
// แสดงเฉพาะโน้ตที่ปักหมุดไว้ (กดไอคอนหมุดบนการ์ดในหน้า /chat) จาก GET /api/notes?pinned=true
//
// ตั้งค่าครั้งแรก: เปิดสคริปต์นี้ในแอป Scriptable แล้วกด ▶︎ จะถามที่อยู่ API กับอีเมล/รหัสผ่าน
// URL กับ token เก็บใน Keychain ของเครื่อง ไม่ได้อยู่ในไฟล์นี้ (รหัสผ่านไม่ถูกเก็บ)
// อยากเปลี่ยนค่า (เช่น URL tunnel เปลี่ยน หรือ token หมดอายุ) ให้กด ▶︎ ในแอปอีกครั้ง

const KEY_BASE = "jodjod_api_base";
const KEY_TOKEN = "jodjod_token";
const REFRESH_MIN = 15;
// ขนาดตัวอักษร: อยากให้ใหญ่/เล็กลงอีก ปรับเลขนี้ได้เลย (1 = ขนาดเดิมตอนแรก)
const TEXT_SCALE = 1.3;
const px = (n) => Math.round(n * TEXT_SCALE);

// สีชุดเดียวกับเว็บ (app/globals.css): กระดาษสมุดสีครีม หมึกกรมท่า
const C = {
  page: new Color("#FAF9F6"),
  rule: new Color("#E6E3DC"),
  margin: new Color("#E59AA5", 0.45),
  ink: new Color("#26343F"),
  muted: new Color("#66737D"),
  faint: new Color("#9AA4AA"),
  marker: new Color("#3D5A73"),
  checklist: new Color("#B8973F"),
  danger: new Color("#A34F45"),
};

// ฟอนต์: ค่าเริ่มต้นใช้ Sukhumvit Set ที่ติดมากับ iPhone (ไม่ต้องลงเพิ่ม, ไทยแบบไม่มีหัวเหมือนเว็บ)
// อยากได้ฟอนต์ตรงกับเว็บเป๊ะ (Chonburi + IBM Plex Sans Thai) ให้ลงฟอนต์ผ่านแอปอย่าง iFont
// แล้วเปลี่ยน USE_WEB_FONTS เป็น true — ถ้าหาฟอนต์ไม่เจอ iOS จะใช้ฟอนต์ระบบแทนเอง
const USE_WEB_FONTS = false;
const F = USE_WEB_FONTS
  ? {
      logo: (n) => new Font("Chonburi-Regular", n),
      regular: (n) => new Font("IBMPlexSansThai-Regular", n),
      semibold: (n) => new Font("IBMPlexSansThai-SemiBold", n),
    }
  : {
      logo: (n) => new Font("SukhumvitSet-Bold", n + 1),
      regular: (n) => new Font("SukhumvitSet-Text", n),
      semibold: (n) => new Font("SukhumvitSet-SemiBold", n),
    };

const TYPE_ICON = { reminder: "bell.fill", checklist: "checklist", todo: "checkmark.circle", note: "note.text" };
const TYPE_COLOR = { reminder: C.danger, checklist: C.checklist, todo: C.marker, note: C.marker };

// พื้นหลังกระดาษมีเส้นบรรทัด + เส้นกั้นหน้าซ้าย แบบหน้าแชทบนเว็บ
function paperBackground(family) {
  const size = family === "small" ? new Size(170, 170) : family === "large" ? new Size(364, 382) : new Size(364, 170);
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = true;
  ctx.respectScreenScale = true;
  ctx.setFillColor(C.page);
  ctx.fillRect(new Rect(0, 0, size.width, size.height));
  ctx.setFillColor(C.rule);
  for (let y = 30; y < size.height; y += px(22)) ctx.fillRect(new Rect(0, y, size.width, 1));
  ctx.setFillColor(C.margin);
  ctx.fillRect(new Rect(10, 0, 1, size.height));
  return ctx.getImage();
}

function read(key) {
  return Keychain.contains(key) ? Keychain.get(key) : "";
}

async function notify(title, message) {
  const a = new Alert();
  a.title = title;
  a.message = message;
  a.addAction("ตกลง");
  await a.present();
}

// login ด้วยอีเมลครั้งเดียวเพื่อขอ token (อายุ 30 วัน) — เก็บแค่ token ไม่เก็บรหัสผ่าน
async function login(base, email, password) {
  const req = new Request(`${base}/api/auth/login`);
  req.method = "POST";
  req.headers = { "Content-Type": "application/json" };
  req.body = JSON.stringify({ email, password });
  req.timeoutInterval = 15;
  try {
    const data = await req.loadJSON();
    if (req.response.statusCode === 200 && data.token) return data.token;
    await notify("login ไม่สำเร็จ", data.error || `HTTP ${req.response.statusCode}`);
  } catch (e) {
    await notify("ต่อ server ไม่ได้", "เช็ก URL ว่าตรงกับ tunnel ที่เปิดอยู่");
  }
  return "";
}

async function setup() {
  const a = new Alert();
  a.title = "ตั้งค่า JodJod widget";
  a.message =
    "ใส่ที่อยู่ API (URL ของ tunnel)\n" +
    "แล้ว login ด้วยอีเมลกับรหัสผ่าน JodJod ครั้งเดียว\n" +
    "ถ้าแค่เปลี่ยน URL ให้เว้นอีเมลกับรหัสผ่านว่างไว้";
  a.addTextField("https://xxxx.trycloudflare.com", read(KEY_BASE));
  a.addTextField("อีเมล");
  a.addSecureTextField("รหัสผ่าน");
  a.addAction("บันทึก");
  a.addCancelAction("ยกเลิก");
  if ((await a.present()) === -1) return;
  const base = a.textFieldValue(0).trim().replace(/\/+$/, "");
  const email = a.textFieldValue(1).trim();
  const password = a.textFieldValue(2);
  if (base) Keychain.set(KEY_BASE, base);
  if (base && email && password) {
    const token = await login(base, email, password);
    if (token) Keychain.set(KEY_TOKEN, token);
  }
}

async function loadPinned() {
  const base = read(KEY_BASE);
  const token = read(KEY_TOKEN);
  if (!base || !token) return { error: "ยังไม่ได้ตั้งค่า — เปิดในแอปแล้วกด ▶︎" };
  const req = new Request(`${base}/api/notes?pinned=true&limit=20`);
  req.headers = { Authorization: `Bearer ${token}` };
  req.timeoutInterval = 15;
  try {
    const data = await req.loadJSON();
    const status = req.response.statusCode;
    if (status === 401) return { error: "token หมดอายุ — เปิดในแอปแล้ว login ใหม่" };
    if (status !== 200) return { error: `โหลดไม่สำเร็จ (HTTP ${status})` };
    return { notes: (data.notes || []).filter((n) => !n.is_done) };
  } catch (e) {
    return { error: "ต่อ server ไม่ได้ (URL tunnel เปลี่ยนหรือเปล่า?)" };
  }
}

function whenText(iso) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  let day;
  if (sameDay(d, today)) day = "วันนี้";
  else if (sameDay(d, tomorrow)) day = "พรุ่งนี้";
  else day = d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} ${time}`;
}

// บรรทัดรองใต้ชื่อโน้ต: เวลาเตือน (ลิสต์แสดงของทีละข้อแยกต่างหาก)
function subText(n) {
  if (n.type === "reminder" && n.remind_at) return whenText(n.remind_at);
  return "";
}

// บรรทัดรองใต้ชื่อโน้ต (เยื้องให้ตรงกับชื่อ)
function addSubLine(w, text, color) {
  const row = w.addStack();
  row.addSpacer(px(18));
  const t = row.addText(text);
  t.font = F.regular(px(10));
  t.textColor = color;
  t.lineLimit = 1;
}

// ของหนึ่งข้อในลิสต์: ช่องติ๊กว่าง + ข้อความ
function addItemLine(w, text) {
  const row = w.addStack();
  row.centerAlignContent();
  row.addSpacer(px(18));
  const box = row.addImage(SFSymbol.named("square").image);
  box.imageSize = new Size(px(10), px(10));
  box.tintColor = C.faint;
  row.addSpacer(px(5));
  const t = row.addText(text);
  t.font = F.regular(px(11));
  t.textColor = C.ink;
  t.lineLimit = 1;
}

function build(result) {
  const family = config.widgetFamily || "medium";
  const w = new ListWidget();
  w.backgroundColor = C.page;
  w.backgroundImage = paperBackground(family);
  w.setPadding(12, 20, 12, 14);
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MIN * 60 * 1000);

  // หัว: โลโก้ "จดจด" แบบเว็บ + ไอคอนหมุดเล็กๆ ด้านขวา
  const head = w.addStack();
  head.centerAlignContent();
  const logo = head.addText("จดจด");
  logo.font = F.logo(px(14));
  logo.textColor = C.ink;
  head.addSpacer();
  const pin = head.addImage(SFSymbol.named("pin.fill").image);
  pin.imageSize = new Size(px(10), px(10));
  pin.tintColor = C.danger;
  w.addSpacer(px(6));

  if (result.error) {
    const t = w.addText(result.error);
    t.font = F.regular(px(12));
    t.textColor = C.muted;
    w.addSpacer();
    return w;
  }

  // งบบรรทัดต่อขนาด widget: ชื่อโน้ต 1 บรรทัด, บรรทัดรอง 1, ของในลิสต์ข้อละ 1
  let budget = family === "small" ? 5 : family === "large" ? 14 : 5;
  const notes = result.notes;

  if (notes.length === 0) {
    const t = w.addText("ยังไม่ได้ปักหมุดอะไร — กดรูปหมุดบนการ์ดในเว็บ");
    t.font = F.regular(px(12));
    t.textColor = C.muted;
  }

  let shown = 0;
  for (const n of notes) {
    if (budget < 1) break;
    shown++;
    budget--;

    const row = w.addStack();
    row.centerAlignContent();
    const icon = row.addImage(SFSymbol.named(TYPE_ICON[n.type] || "pin.fill").image);
    icon.imageSize = new Size(px(12), px(12));
    icon.tintColor = TYPE_COLOR[n.type] || C.marker;
    row.addSpacer(px(6));
    const title = row.addText(n.content || "(ไม่มีชื่อ)");
    title.font = F.semibold(px(12));
    title.textColor = C.ink;
    title.lineLimit = 1;

    if (n.type === "checklist" && n.items && n.items.length > 0) {
      // ความคืบหน้า "1/3" ด้านขวาแบบการ์ดบนเว็บ
      row.addSpacer();
      const done = n.items.filter((i) => i.is_done).length;
      const prog = row.addText(`${done}/${n.items.length}`);
      prog.font = F.regular(px(10));
      prog.textColor = C.faint;

      const left = n.items.filter((i) => !i.is_done);
      if (left.length === 0 && budget >= 1) {
        budget--;
        addSubLine(w, "ครบแล้ว", C.muted);
      }
      // ข้อที่ยังไม่ได้ติ๊ก ทีละบรรทัด; ที่ไม่พอที่จะสรุปเป็น "+ อีก N ข้อ"
      for (let i = 0; i < left.length; i++) {
        const remaining = left.length - i;
        if (budget < 1) break;
        if (remaining > 1 && budget === 1) {
          budget--;
          addSubLine(w, `+ อีก ${remaining} ข้อ`, C.faint);
          break;
        }
        budget--;
        addItemLine(w, left[i].text);
      }
    } else {
      const sub = subText(n);
      if (sub && budget >= 1) {
        budget--;
        // เวลาเตือนสีแดงอิฐแบบการ์ดบนเว็บ ที่เหลือเป็นหมึกจาง
        addSubLine(w, sub, n.type === "reminder" ? C.danger : C.muted);
      }
    }
    w.addSpacer(px(4));
  }

  const rest = notes.length - shown;
  if (rest > 0) {
    const more = w.addText(`+ อีก ${rest} รายการ`);
    more.font = F.regular(px(10));
    more.textColor = C.faint;
  }
  w.addSpacer();
  return w;
}

if (config.runsInWidget) {
  Script.setWidget(build(await loadPinned()));
} else {
  await setup();
  const w = build(await loadPinned());
  await w.presentMedium();
}
Script.complete();
