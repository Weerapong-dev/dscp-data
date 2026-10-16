# DSCP — ระบบตรวจสอบการเดินเอกสาร

**Document Status Control Panel** | ระบบตรวจสอบการเดินเอกสารในสถานศึกษา

---

## ✨ คุณสมบัติหลัก

- 🔴🟡🟢 ไฟสถานะแบบ Real-time สำหรับแต่ละฝ่าย
- 👥 3 ระดับผู้ใช้: Admin / ผู้บริหาร / เจ้าหน้าที่
- 📁 เก็บข้อมูลบน **GitHub** (ไม่ต้องมี Server)
- 🔒 การ Login ด้วย SHA-256 password hashing
- 📋 Audit Log บันทึกทุกการดำเนินการ
- 📱 Responsive รองรับมือถือ

---

## 🚀 วิธีติดตั้งและใช้งาน

### ขั้นที่ 1 — สร้าง GitHub Repository

1. ไปที่ [github.com](https://github.com) → สร้าง Repository ใหม่
2. ตั้งชื่อ เช่น `dscp-data`
3. เลือก **Private** (แนะนำ)
4. ✅ Initialize with README

### ขั้นที่ 2 — สร้าง Personal Access Token (PAT)

1. ไปที่ GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Generate new token (classic)
3. เลือกสิทธิ์ `repo` (ทั้งหมด)
4. คัดลอก token ไว้ (ขึ้นต้นด้วย `ghp_`)

### ขั้นที่ 3 — เปิดระบบ

1. เปิดไฟล์ `index.html` ด้วย Browser (Chrome/Edge/Firefox)
   - หรือใช้ VS Code Live Server
   - หรือ double-click ที่ไฟล์
2. ระบบจะแสดงหน้า **ตั้งค่า GitHub**
3. กรอก: GitHub Owner, Repository Name, Personal Access Token
4. กด **เชื่อมต่อและตั้งค่าระบบ**
5. รอ 10-30 วินาที (ระบบสร้างข้อมูลเริ่มต้นใน GitHub)

### ขั้นที่ 4 — เข้าสู่ระบบ

| ผู้ใช้ | Username | Password | สิทธิ์ |
|--------|----------|----------|--------|
| Admin  | `admin`  | `admin1234` | ผู้ดูแลระบบ (Full Access) |
| ผู้บริหาร | `manager` | `manager1234` | ดูสถานะ (Read-only) |
| เจ้าหน้าที่ A | `staffa` | `staff1234` | จัดการเอกสาร + สถานะฝ่าย A |
| เจ้าหน้าที่ B | `staffb` | `staff1234` | จัดการเอกสาร + สถานะฝ่าย B |
| เจ้าหน้าที่ C | `staffc` | `staff1234` | จัดการเอกสาร + สถานะฝ่าย C |

> ⚠️ **ควรเปลี่ยนรหัสผ่านทันทีหลังเข้าระบบครั้งแรก** (Admin Panel → จัดการผู้ใช้)

---

## 🔐 สิทธิ์การใช้งาน

| ฟีเจอร์ | Admin | ผู้บริหาร | เจ้าหน้าที่ |
|---------|-------|-----------|-------------|
| ดูแดชบอร์ด | ✅ | ✅ | ✅ |
| สร้างเอกสาร | ✅ | ❌ | ✅ |
| แก้ไขเอกสาร | ✅ | ❌ | ✅ |
| ลบเอกสาร | ✅ | ❌ | ❌ |
| เปลี่ยนสถานะ (ฝ่ายตัวเอง) | ✅ | ❌ | ✅ |
| เปลี่ยนสถานะ (ทุกฝ่าย) | ✅ | ❌ | ❌ |
| จัดการผู้ใช้ | ✅ | ❌ | ❌ |
| จัดการฝ่าย | ✅ | ❌ | ❌ |
| ดู Audit Log | ✅ | ❌ | ❌ |
| ตั้งค่า GitHub | ✅ | ❌ | ❌ |

---

## 💡 การทำงานของไฟสถานะ

```
🔴 แดง  = ยังไม่ถึงฝ่ายนั้น / ค่าเริ่มต้น
🟡 เหลือง = เอกสารมาถึงแล้ว แต่ยังรอดำเนินการ  
🟢 เขียว = ฝ่ายนั้นดำเนินการเรียบร้อยแล้ว
```

เจ้าหน้าที่แต่ละฝ่ายสามารถเปลี่ยนสถานะของฝ่ายตัวเองเท่านั้น  
Admin สามารถเปลี่ยนสถานะได้ทุกฝ่าย

---

## 📂 โครงสร้างไฟล์

```
DSCP system/
├── index.html          # SPA Entry Point
├── css/
│   └── style.css       # Design System
├── js/
│   ├── config.js       # ค่าคงที่และค่าเริ่มต้น
│   ├── github.js       # GitHub API Service
│   ├── auth.js         # Authentication
│   ├── documents.js    # Data Management
│   ├── ui.js           # UI Rendering Engine
│   └── app.js          # Application Controller
└── README.md
```

GitHub Repository จะมีโครงสร้าง:
```
dscp-data/
└── data/
    ├── departments.json  # ข้อมูลฝ่าย
    ├── documents.json    # เอกสารและ Audit Log
    └── users.json        # ผู้ใช้งาน
```

---

## ⚠️ ข้อควรระวัง

- **GitHub Token** เก็บใน localStorage ของ Browser เท่านั้น (ไม่อัปโหลดขึ้น GitHub)
- GitHub API limit: 5,000 requests/hour (เพียงพอสำหรับการใช้งานปกติ)
- ข้อมูลทั้งหมดเป็น JSON ใน GitHub Repository สามารถดู version history ได้

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (No Framework)
- **Backend**: GitHub REST API v3
- **Storage**: GitHub Repository (JSON files)
- **Auth**: SHA-256 Password Hashing (Web Crypto API)
- **Font**: Sarabun (Google Fonts)
- **Design**: Dark Mode + Glassmorphism
