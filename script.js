/* =====================================================================
   HOSTEL MANAGEMENT SYSTEM - script.js
   Everything is stored in the browser (localStorage) so the demo works
   without a backend.  Sections:
     1. Helpers          5. Public / login pages
     2. Sample data      6. Student dashboard
     3. Database         7. Admin dashboard
     4. Auth + UI
   ===================================================================== */

/* ---------- 1. HELPERS ---------- */
const DB_KEY = 'hms_db_v1';
const SESSION_KEY = 'hms_session_v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dstr(new Date());
const fmtDate = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const dayName = (d = new Date()) => d.toLocaleDateString('en-US', { weekday: 'long' });
const val = id => ($('#' + id) ? $('#' + id).value.trim() : '');

function toast(msg, type = '') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800);
}
function openModal(title, html) {
  let m = $('#modal');
  if (!m) { m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-bg'; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) closeModal(); }); }
  m.innerHTML = `<div class="modal"><h3>${title}<button class="close" onclick="closeModal()">&times;</button></h3>${html}</div>`;
  m.classList.add('show');
}
function closeModal() { const m = $('#modal'); if (m) m.classList.remove('show'); }

function badge(text) {
  const map = { Paid: 'green', Pending: 'orange', Partial: 'blue', Approved: 'green', Rejected: 'red', Resolved: 'green', 'In Progress': 'blue', Present: 'green', Absent: 'red', Emergency: 'red', Event: 'purple', Maintenance: 'orange', Mess: 'green', Notice: 'blue', Occupied: 'red', Vacant: 'green' };
  return `<span class="badge ${map[text] || 'gray'}">${esc(text)}</span>`;
}

/* Simple SVG charts (no external library needed) */
function donut(items, centerText = '') {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  let off = 0; const r = 52, c = 2 * Math.PI * r;
  const arcs = items.map(i => {
    const len = (i.value / total) * c;
    const s = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${i.color}" stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += len; return s;
  }).join('');
  const legend = items.map(i => `<div><i style="background:${i.color}"></i>${esc(i.label)}: <b>${i.value}</b></div>`).join('');
  return `<div class="chart-box"><svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="#eef1fb" stroke-width="22"/>${arcs}<text x="70" y="76" text-anchor="middle" font-size="18" font-weight="700" fill="#1f2937">${centerText}</text></svg><div class="legend">${legend}</div></div>`;
}
function barChart(labels, values, color = '#2f5bea', max = 100, suffix = '%') {
  const w = 340, h = 170, bw = w / labels.length;
  const bars = values.map((v, i) => {
    const bh = (v / max) * 120;
    return `<rect x="${i * bw + 8}" y="${140 - bh}" width="${bw - 16}" height="${bh}" rx="6" fill="${color}"/><text x="${i * bw + bw / 2}" y="${134 - bh}" text-anchor="middle" font-size="10" fill="#374151">${v}${suffix}</text><text x="${i * bw + bw / 2}" y="158" text-anchor="middle" font-size="10" fill="#6b7280">${esc(labels[i])}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="190">${bars}</svg>`;
}

/* ---------- 2. SAMPLE DATA ---------- */
function seedDatabase() {
  let sv = 11; const rnd = () => { sv = (sv * 9301 + 49297) % 233280; return sv / 233280; };
  const depts = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE'];
  const boys = ['Arjun Kumar', 'Rahul Sharma', 'Karthik Raja', 'Vignesh S', 'Mohammed Aslam', 'Surya Prakash', 'Harish M', 'Naveen Kumar', 'Deepak R', 'Sanjay V', 'Praveen K', 'Aditya Singh'];
  const girls = ['Priya Dharshini', 'Ananya R', 'Divya Lakshmi', 'Meena K', 'Sneha Patel', 'Kavya Nair', 'Aishwarya S', 'Nandhini P', 'Riya Gupta', 'Swathi M', 'Pooja Reddy', 'Fathima Begum'];
  const boyRooms = ['A-101', 'A-101', 'A-101', 'A-102', 'A-102', 'A-102', 'A-103', 'A-103', 'A-104', 'A-104', 'A-104', 'A-105'];
  const girlRooms = ['B-101', 'B-101', 'B-101', 'B-102', 'B-102', 'B-103', 'B-103', 'B-104', 'B-104', 'B-104', 'B-105', 'B-105'];

  const db = {
    settings: {
      hostelName: 'Sri Vidya Hostel', collegeName: 'Sri Vidya Institute of Technology',
      totalFee: 60000, feeDue: dstr(new Date(Date.now() + 20 * 864e5)),
      contacts: {
        warden: { name: 'Dr. R. Meenakshi (Chief Warden)', phone: '+91 98765 00001' },
        office: { name: 'Hostel Office (9 AM - 5 PM)', phone: '+91 98765 00002' },
        security: { name: 'Main Gate Security (24x7)', phone: '+91 98765 00003' },
        medical: { name: 'Campus Medical Centre', phone: '+91 98765 00004' }
      }
    },
    admins: [{ username: 'admin', name: 'Dr. R. Meenakshi', email: 'warden@college.edu', phone: '9876500001', password: 'admin123' }],
    buildings: [{ id: 'A', name: 'Block A (Boys)' }, { id: 'B', name: 'Block B (Girls)' }],
    rooms: [
      ['A-101', 'A', 3], ['A-102', 'A', 3], ['A-103', 'A', 3], ['A-104', 'A', 3], ['A-105', 'A', 2], ['A-106', 'A', 4],
      ['B-101', 'B', 3], ['B-102', 'B', 3], ['B-103', 'B', 2], ['B-104', 'B', 4], ['B-105', 'B', 3]
    ].map(r => ({ id: r[0], building: r[1], capacity: r[2] })),
    students: [], attendance: {}, leaves: [], complaints: [], notices: [],
    mess: { menu: {}, announcements: [], feedback: [] }
  };

  const makeStudent = (name, i, gender, room) => {
    const year = (i % 4) + 1, dept = depts[i % depts.length];
    const reg = `${2027 - year}${dept}${pad(i + 1).padStart(3, '0')}`;
    const first = name.split(' ')[0].toLowerCase();
    const paidPlan = [60000, 30000, 45000, 15000, 0, 60000][i % 6];
    const payments = [];
    if (paidPlan >= 30000) { payments.push({ id: 'P' + (5000 + i * 2), date: '2026-06-' + pad(5 + (i % 15)), amount: 30000, mode: 'UPI' }); }
    if (paidPlan === 60000) payments.push({ id: 'P' + (5001 + i * 2), date: '2026-09-' + pad(3 + (i % 20)), amount: 30000, mode: 'Net Banking' });
    if (paidPlan === 45000) payments.push({ id: 'P' + (5001 + i * 2), date: '2026-09-10', amount: 15000, mode: 'Card' });
    if (paidPlan === 15000) payments.push({ id: 'P' + (5000 + i * 2), date: '2026-07-12', amount: 15000, mode: 'Cash' });
    return {
      regNo: reg, name, gender, email: `${first}${i + 1}@college.edu`, phone: '98765' + String(10000 + i * 137).slice(-5),
      password: 'student123', dept, year, room, bed: 0,
      guardian: 'Mr. ' + name.split(' ').slice(-1)[0] + ' (Parent)', guardianPhone: '99440' + String(20000 + i * 91).slice(-5),
      blood: ['O+', 'A+', 'B+', 'AB+', 'O-'][i % 5], address: `${12 + i}, Gandhi Street, ${['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'][i % 5]}, Tamil Nadu`,
      fee: { total: 60000, payments }
    };
  };
  boys.forEach((n, i) => db.students.push(makeStudent(n, i, 'Male', boyRooms[i])));
  girls.forEach((n, i) => db.students.push(makeStudent(n, i + 12, 'Female', girlRooms[i])));
  // assign bed numbers
  db.rooms.forEach(r => db.students.filter(s => s.room === r.id).forEach((s, k) => s.bed = k + 1));

  // attendance for the last 45 days
  for (let d = 45; d >= 0; d--) {
    const day = dstr(new Date(Date.now() - d * 864e5)); db.attendance[day] = {};
    db.students.forEach((s, i) => { const p = 0.96 - (i % 6) * 0.045; db.attendance[day][s.regNo] = rnd() < p ? 'P' : 'A'; });
  }

  const S = db.students;
  const ago = n => dstr(new Date(Date.now() - n * 864e5)), ahead = n => dstr(new Date(Date.now() + n * 864e5));
  db.leaves = [
    { id: 'L1001', reg: S[0].regNo, type: 'Home Visit', from: ahead(3), to: ahead(6), reason: 'Family function at hometown', status: 'Pending', applied: ago(1) },
    { id: 'L1002', reg: S[1].regNo, type: 'Medical', from: ago(10), to: ago(8), reason: 'Fever and doctor consultation', status: 'Approved', applied: ago(12) },
    { id: 'L1003', reg: S[13].regNo, type: 'Emergency', from: ago(5), to: ago(4), reason: 'Grandmother hospitalised', status: 'Approved', applied: ago(6) },
    { id: 'L1004', reg: S[5].regNo, type: 'Outing', from: ago(15), to: ago(15), reason: 'Weekend outing with cousin', status: 'Rejected', applied: ago(17) },
    { id: 'L1005', reg: S[16].regNo, type: 'Home Visit', from: ahead(8), to: ahead(12), reason: 'Sister\'s engagement', status: 'Pending', applied: today() },
    { id: 'L1006', reg: S[3].regNo, type: 'Academic', from: ago(2), to: ahead(1), reason: 'Inter-college symposium at Anna University', status: 'Approved', applied: ago(5) }
  ];
  db.complaints = [
    { id: 'C2001', reg: S[0].regNo, category: 'Electricity', desc: 'Ceiling fan makes loud noise and wobbles.', date: ago(4), status: 'In Progress' },
    { id: 'C2002', reg: S[0].regNo, category: 'Internet', desc: 'Wi-Fi very slow in the evenings.', date: ago(9), status: 'Resolved' },
    { id: 'C2003', reg: S[2].regNo, category: 'Water', desc: 'No hot water in bathroom on 1st floor.', date: ago(2), status: 'Pending' },
    { id: 'C2004', reg: S[14].regNo, category: 'Cleaning', desc: 'Corridor not cleaned for two days.', date: ago(3), status: 'Pending' },
    { id: 'C2005', reg: S[7].regNo, category: 'Food/Mess', desc: 'Rice was undercooked at dinner yesterday.', date: ago(1), status: 'Pending' },
    { id: 'C2006', reg: S[18].regNo, category: 'Room Maintenance', desc: 'Window latch is broken.', date: ago(6), status: 'In Progress' },
    { id: 'C2007', reg: S[9].regNo, category: 'Other', desc: 'Need an extra study table in the room.', date: ago(12), status: 'Resolved' }
  ];
  db.notices = [
    { id: 'N1', title: 'Water Supply Maintenance', type: 'Maintenance', msg: 'Water supply will be off on Sunday from 10 AM to 2 PM due to tank cleaning.', date: ago(1) },
    { id: 'N2', title: 'Hostel Day Celebration', type: 'Event', msg: 'Annual Hostel Day will be held on the 20th at 6 PM in the open auditorium. All residents are invited.', date: ago(2) },
    { id: 'N3', title: 'Fire Safety Drill', type: 'Emergency', msg: 'A mandatory fire safety drill will be conducted tomorrow at 5 PM. Assemble at the ground in front of your block.', date: ago(0) },
    { id: 'N4', title: 'Special Dinner on Saturday', type: 'Mess', msg: 'Biryani and ice-cream will be served for dinner this Saturday.', date: ago(3) },
    { id: 'N5', title: 'Hostel Fee Reminder', type: 'Notice', msg: 'Please clear the pending hostel fee before the due date to avoid a late fine.', date: ago(5) }
  ];
  const M = (b, l, s, d) => ({ breakfast: b, lunch: l, snacks: s, dinner: d });
  db.mess.menu = {
    Monday: M('Idli, Sambar, Chutney', 'Rice, Dal, Potato Fry, Curd', 'Tea, Banana Fritters', 'Chapati, Veg Kurma'),
    Tuesday: M('Pongal, Vada, Sambar', 'Rice, Sambar, Beans Poriyal', 'Tea, Sundal', 'Dosa, Tomato Chutney'),
    Wednesday: M('Poori, Potato Masala', 'Veg Pulao, Raita, Papad', 'Coffee, Biscuits', 'Chapati, Paneer Gravy'),
    Thursday: M('Upma, Coconut Chutney', 'Rice, Rasam, Cabbage Poriyal', 'Tea, Samosa', 'Idiyappam, Egg Curry / Veg Stew'),
    Friday: M('Dosa, Sambar', 'Lemon Rice, Chicken 65 / Gobi 65', 'Tea, Bhajji', 'Parotta, Salna'),
    Saturday: M('Aloo Paratha, Curd', 'Rice, Dal Fry, Mixed Veg', 'Milk, Cake Slice', 'Veg / Chicken Biryani, Raita, Ice-cream'),
    Sunday: M('Masala Dosa, Chutney', 'Special Meals, Payasam', 'Tea, Cutlet', 'Fried Rice, Gobi Manchurian')
  };
  db.mess.announcements = [
    { id: 'MA1', text: 'Mess timings: Breakfast 7:30-9:00, Lunch 12:30-2:00, Snacks 4:30-5:30, Dinner 7:30-9:00.', date: ago(10) },
    { id: 'MA2', text: 'Mess committee meeting on Friday 4 PM. Students may share suggestions.', date: ago(2) }
  ];
  db.mess.feedback = [
    { reg: S[3].regNo, name: S[3].name, rating: 4, comment: 'Biryani was great, please increase snack variety.', date: ago(2) },
    { reg: S[14].regNo, name: S[14].name, rating: 3, comment: 'Breakfast is often served cold.', date: ago(5) }
  ];
  return db;
}

/* ---------- 3. DATABASE ---------- */
function loadDB() {
  try { const raw = localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw); } catch (e) { }
  const fresh = seedDatabase(); localStorage.setItem(DB_KEY, JSON.stringify(fresh)); return fresh;
}
let db = loadDB();
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function resetDemoData() {
  if (!confirm('Reset all data back to the demo sample data?')) return;
  db = seedDatabase(); saveDB(); toast('Demo data restored', 'success'); setTimeout(() => location.reload(), 600);
}

/* Data helpers */
const getStudent = reg => db.students.find(s => s.regNo === reg);
const getRoom = id => db.rooms.find(r => r.id === id);
const roomStudents = id => db.students.filter(s => s.room === id);
const paidAmount = s => s.fee.payments.reduce((a, p) => a + p.amount, 0);
const pendingAmount = s => Math.max(0, s.fee.total - paidAmount(s));
const feeStatus = s => { const p = paidAmount(s); return p >= s.fee.total ? 'Paid' : p > 0 ? 'Partial' : 'Pending'; };
function attStats(reg, monthPrefix) {
  let p = 0, a = 0;
  Object.keys(db.attendance).forEach(d => {
    if (monthPrefix && !d.startsWith(monthPrefix)) return;
    const v = db.attendance[d][reg]; if (v === 'P') p++; else if (v === 'A') a++;
  });
  const t = p + a; return { present: p, absent: a, total: t, pct: t ? Math.round((p / t) * 100) : 0 };
}
const onLeaveToday = reg => db.leaves.some(l => l.reg === reg && l.status === 'Approved' && l.from <= today() && l.to >= today());
const nextId = (prefix, list, start) => prefix + (Math.max(start, ...list.map(x => parseInt(String(x.id).replace(/\D/g, '')) || 0)) + 1);
function roomLabel(s) { return s.room ? `${s.room} (Bed ${s.bed})` : 'Not allotted'; }
function buildingName(id) { const b = db.buildings.find(b => b.id === id); return b ? b.name : id; }

/* ---------- 4. AUTH + COMMON UI ---------- */
const session = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } };
function logout() { localStorage.removeItem(SESSION_KEY); location.href = 'login.html'; }
function guard(role) {
  const s = session();
  if (!s || s.role !== role) { location.href = 'login.html'; return null; }
  const u = role === 'student' ? getStudent(s.id) : db.admins.find(a => a.username === s.id);
  if (!u) { logout(); return null; }
  return u;
}
function setupShell(title, links, user, roleLabel) {
  $('#sidebar').innerHTML = `<div class="brand"><div class="logo">🏨</div>${esc(db.settings.hostelName)}</div><div class="role-tag">${roleLabel}</div>
    <nav>${links.map(l => `<a data-sec="${l[0]}" onclick="showSection('${l[0]}')"><span>${l[1]}</span>${l[2]}</a>`).join('')}
    <a onclick="logout()"><span>🚪</span>Logout</a></nav><div class="side-foot">${esc(db.settings.collegeName)}</div>`;
  $('#userChip').innerHTML = `<div class="avatar">${initials(user.name)}</div><div class="uname"><b>${esc(user.name)}</b><br><small style="color:#6b7280">${roleLabel}</small></div>`;
  $('#menuBtn').onclick = toggleSidebar; $('#overlay').onclick = toggleSidebar;
}
function toggleSidebar() { $('#sidebar').classList.toggle('open'); $('#overlay').classList.toggle('show'); }

let currentSection = '';
function showSection(name) {
  currentSection = name;
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.sidebar nav a').forEach(a => a.classList.toggle('active', a.dataset.sec === name));
  const sec = $('#sec-' + name); if (!sec) return;
  sec.classList.add('active');
  const link = $(`.sidebar nav a[data-sec="${name}"]`);
  $('#pageTitle').textContent = link ? link.lastChild.textContent.trim() : name;
  (window.renderers && window.renderers[name]) && window.renderers[name](sec);
  $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show');
  history.replaceState(null, '', '#' + name); window.scrollTo(0, 0);
}
function refresh() { showSection(currentSection); }
function startPage(defaultSec) {
  const h = location.hash.replace('#', '');
  showSection($('#sec-' + h) ? h : defaultSec);
}

/* ---------- 5. PUBLIC / LOGIN PAGES ---------- */
function initHome() {
  const c = db.settings.contacts;
  $('#homeStats').innerHTML = `<div><b>${db.students.length}</b>Residents</div><div><b>${db.rooms.length}</b>Rooms</div><div><b>${db.buildings.length}</b>Blocks</div><div><b>24x7</b>Security</div>`;
  $('#homeNotices').innerHTML = [...db.notices].reverse().slice(0, 3).map(noticeHTML).join('');
  $('#homeContacts').innerHTML = `<ul class="info-list">
    <li><span>Warden</span><b>${esc(c.warden.name)}<br>${esc(c.warden.phone)}</b></li>
    <li><span>Hostel Office</span><b>${esc(c.office.phone)}</b></li>
    <li><span>Security</span><b>${esc(c.security.phone)}</b></li>
    <li><span>Medical Centre</span><b>${esc(c.medical.phone)}</b></li>
    <li><span>Ambulance / Police / Fire</span><b>108 / 100 / 101</b></li></ul>`;
  $('#hostelNameBrand').textContent = db.settings.hostelName;
}
function switchAuthTab(tab) {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.auth-form').forEach(f => f.style.display = f.id === 'form-' + tab ? 'block' : 'none');
  $$('.alert').forEach(a => { a.className = 'alert'; a.textContent = ''; });
}
function authMsg(id, msg, ok) { const a = $('#' + id); a.textContent = msg; a.className = 'alert ' + (ok ? 'ok' : 'error'); }
function doLogin(role) {
  const id = val(role + 'Id'), pw = $('#' + role + 'Pw').value;
  if (!id || !pw) return authMsg(role + 'Alert', 'Please enter your ID and password.');
  const low = id.toLowerCase();
  let user;
  if (role === 'student') user = db.students.find(s => (s.regNo.toLowerCase() === low || s.email.toLowerCase() === low || s.phone === id) && s.password === pw);
  else user = db.admins.find(a => (a.username.toLowerCase() === low || a.email.toLowerCase() === low || a.phone === id) && a.password === pw);
  if (!user) return authMsg(role + 'Alert', 'Invalid credentials. Please try again.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, id: role === 'student' ? user.regNo : user.username }));
  authMsg(role + 'Alert', 'Login successful! Redirecting...', true);
  setTimeout(() => location.href = role === 'student' ? 'student-dashboard.html' : 'admin-dashboard.html', 500);
}
function doRegister() {
  const f = { name: val('rName'), regNo: val('rReg').toUpperCase(), email: val('rEmail').toLowerCase(), phone: val('rPhone'), dept: val('rDept'), year: +val('rYear'), gender: val('rGender'), pw: $('#rPw').value, pw2: $('#rPw2').value };
  if (Object.values(f).some(v => v === '' || v === 0 || Number.isNaN(v))) return authMsg('regAlert', 'Please fill in all fields.');
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return authMsg('regAlert', 'Enter a valid email address.');
  if (!/^\d{10}$/.test(f.phone)) return authMsg('regAlert', 'Phone number must be 10 digits.');
  if (f.pw.length < 6) return authMsg('regAlert', 'Password must be at least 6 characters.');
  if (f.pw !== f.pw2) return authMsg('regAlert', 'Passwords do not match.');
  if (db.students.some(s => s.regNo === f.regNo || s.email === f.email || s.phone === f.phone)) return authMsg('regAlert', 'Register number, email or phone is already registered.');
  db.students.push({ regNo: f.regNo, name: f.name, gender: f.gender, email: f.email, phone: f.phone, password: f.pw, dept: f.dept, year: f.year, room: '', bed: 0, guardian: '', guardianPhone: '', blood: '', address: '', fee: { total: db.settings.totalFee, payments: [] } });
  saveDB(); authMsg('regAlert', 'Registration successful! You can now log in. The warden will allot your room.', true);
  setTimeout(() => { switchAuthTab('student'); $('#studentId').value = f.regNo; }, 1500);
}
function forgotPassword() {
  openModal('Reset Password', `<p style="font-size:.88rem;color:#6b7280;margin-bottom:12px">Demo version: enter your registered email/phone and choose a new password. (A real system would send an OTP/email link.)</p>
    <div class="form-group"><label>Role</label><select id="fpRole"><option value="student">Student</option><option value="admin">Warden / Admin</option></select></div>
    <div class="form-group"><label>Registered Email or Phone</label><input id="fpId"></div>
    <div class="form-group"><label>New Password</label><input id="fpPw" type="password" placeholder="Min 6 characters"></div>
    <button class="btn block" onclick="submitForgot()">Reset Password</button>`);
}
function submitForgot() {
  const role = val('fpRole'), id = val('fpId').toLowerCase(), pw = $('#fpPw').value;
  if (!id || pw.length < 6) return toast('Enter details and a 6+ character password', 'error');
  const list = role === 'student' ? db.students : db.admins;
  const u = list.find(x => x.email.toLowerCase() === id || x.phone === id);
  if (!u) return toast('No account found with that email/phone', 'error');
  u.password = pw; saveDB(); closeModal(); toast('Password updated. Please log in.', 'success');
}
function initLogin() {
  const s = session();
  if (s) { location.href = s.role === 'student' ? 'student-dashboard.html' : 'admin-dashboard.html'; return; }
  const demo = db.students[0];
  $('#studentHint').innerHTML = `<b>Demo student:</b> ${demo.regNo} / student123`;
  $('#adminHint').innerHTML = `<b>Demo warden:</b> admin / admin123`;
  const h = location.hash.replace('#', ''); if (['student', 'admin', 'register'].includes(h)) switchAuthTab(h);
}

/* Shared HTML snippets */
function noticeHTML(n) {
  return `<div class="notice ${esc(n.type)}"><h4>${esc(n.title)} ${badge(n.type)}</h4><small>${fmtDate(n.date)}</small><p>${esc(n.msg)}</p></div>`;
}
function contactHTML() {
  const c = db.settings.contacts;
  return `<div class="grid-2"><div class="card"><h3>📞 Hostel Contacts</h3><ul class="info-list">
    <li><span>Warden</span><b>${esc(c.warden.name)}<br>${esc(c.warden.phone)}</b></li>
    <li><span>Hostel Office</span><b>${esc(c.office.name)}<br>${esc(c.office.phone)}</b></li>
    <li><span>Security</span><b>${esc(c.security.name)}<br>${esc(c.security.phone)}</b></li>
    <li><span>Medical Centre</span><b>${esc(c.medical.name)}<br>${esc(c.medical.phone)}</b></li></ul></div>
    <div class="card"><h3>🚨 Emergency Numbers</h3><ul class="info-list">
    <li><span>Ambulance</span><b>108</b></li><li><span>Police</span><b>100</b></li><li><span>Fire</span><b>101</b></li>
    <li><span>Women Helpline</span><b>1091</b></li><li><span>Anti-Ragging Helpline</span><b>1800-180-5522</b></li></ul></div>
    <div class="card" style="grid-column:1/-1"><h3>📜 Important Hostel Rules</h3><ol style="padding-left:20px;font-size:.92rem;line-height:1.9">
    <li>Hostel gates close at 9:00 PM. Late entry needs prior permission from the warden.</li>
    <li>Leave must be applied through the portal and approved before leaving the campus.</li>
    <li>Ragging in any form is strictly prohibited and punishable by law.</li>
    <li>Visitors are allowed only in the visitors' hall between 4 PM and 6 PM.</li>
    <li>Electrical appliances like heaters and induction stoves are not permitted in rooms.</li>
    <li>Keep rooms and common areas clean. Switch off lights and fans when leaving.</li>
    <li>Smoking, alcohol and prohibited substances are strictly banned.</li>
    <li>Hostel fees must be paid before the due date to avoid a late fine.</li></ol></div></div>`;
}
function messMenuTable(highlight) {
  return `<div class="table-wrap"><table><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snacks</th><th>Dinner</th></tr>
    ${Object.keys(db.mess.menu).map(d => { const m = db.mess.menu[d]; return `<tr ${d === highlight ? 'style="background:#eef6ff"' : ''}><td><b>${d}</b>${d === highlight ? ' ' + badge('Today') : ''}</td><td>${esc(m.breakfast)}</td><td>${esc(m.lunch)}</td><td>${esc(m.snacks)}</td><td>${esc(m.dinner)}</td></tr>`; }).join('')}</table></div>`;
}
function roomVisual(r) {
  const occ = roomStudents(r.id); const beds = [];
  for (let i = 1; i <= r.capacity; i++) { const s = occ.find(x => x.bed === i); beds.push(`<div class="bed ${s ? 'taken' : ''}">${s ? '🛏 ' + i : 'Free'}</div>`); }
  return `<div class="beds">${beds.join('')}</div>`;
}

/* ---------- 6. STUDENT DASHBOARD ---------- */
let me = null;
const studentLinks = [
  ['dashboard', '🏠', 'Dashboard'], ['profile', '👤', 'My Profile'], ['room', '🛏️', 'Room Details'], ['attendance', '✅', 'Attendance'],
  ['leave', '📝', 'Leave Management'], ['complaints', '🛠️', 'Complaints'], ['mess', '🍽️', 'Mess'], ['fees', '💳', 'Hostel Fees'],
  ['notices', '📢', 'Notices'], ['contact', '📞', 'Contact / Emergency']
];
function initStudent() {
  me = guard('student'); if (!me) return;
  setupShell('Student', studentLinks, me, 'Student');
  window.renderers = studentRenderers; startPage('dashboard');
}
const reloadMe = () => { me = getStudent(me.regNo); };

const studentRenderers = {
  dashboard(el) {
    reloadMe(); const a = attStats(me.regNo);
    const myC = db.complaints.filter(c => c.reg === me.regNo), openC = myC.filter(c => c.status !== 'Resolved').length;
    const myL = db.leaves.filter(l => l.reg === me.regNo), pendL = myL.filter(l => l.status === 'Pending').length;
    const m = db.mess.menu[dayName()], c = db.settings.contacts;
    el.innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,#1f3fb0,#2f5bea);color:#fff"><h3 style="color:#fff;margin:0">Welcome back, ${esc(me.name.split(' ')[0])}! 👋</h3>
      <p style="opacity:.9;margin-top:6px">${esc(me.regNo)} • ${esc(me.dept)} • Year ${me.year} • ${me.room ? 'Room ' + esc(me.room) : 'Room not allotted yet'}</p></div>
    <div class="stat-grid">
      <div class="stat"><div class="ic">🛏️</div><div><b>${esc(me.room || '—')}</b><span>Room / Bed ${me.bed || '-'}</span></div></div>
      <div class="stat green"><div class="ic">✅</div><div><b>${a.pct}%</b><span>Attendance</span></div></div>
      <div class="stat orange"><div class="ic">💳</div><div><b>${money(pendingAmount(me))}</b><span>Pending fee</span></div></div>
      <div class="stat red"><div class="ic">🛠️</div><div><b>${openC}</b><span>Open complaints</span></div></div>
      <div class="stat purple"><div class="ic">📝</div><div><b>${pendL}</b><span>Pending leave requests</span></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3>📢 Latest Notices <a class="link" onclick="showSection('notices')">View all</a></h3>${[...db.notices].reverse().slice(0, 3).map(noticeHTML).join('')}</div>
      <div>
        <div class="card"><h3>🍽️ Today's Mess Menu (${dayName()})</h3><ul class="info-list">
          <li><span>Breakfast</span><b>${esc(m.breakfast)}</b></li><li><span>Lunch</span><b>${esc(m.lunch)}</b></li>
          <li><span>Snacks</span><b>${esc(m.snacks)}</b></li><li><span>Dinner</span><b>${esc(m.dinner)}</b></li></ul></div>
        <div class="card" style="margin-top:22px"><h3>🚨 Emergency Contacts</h3><ul class="info-list">
          <li><span>Warden</span><b>${esc(c.warden.phone)}</b></li><li><span>Security</span><b>${esc(c.security.phone)}</b></li>
          <li><span>Ambulance</span><b>108</b></li><li><span>My Guardian</span><b>${esc(me.guardianPhone || 'Not added')}</b></li></ul></div>
      </div>
    </div>`;
  },

  profile(el) {
    reloadMe();
    el.innerHTML = `<div class="grid-2"><div class="card"><div style="display:flex;gap:18px;align-items:center;margin-bottom:16px"><div class="avatar lg">${initials(me.name)}</div>
      <div><h2>${esc(me.name)}</h2><p style="color:#6b7280">${esc(me.regNo)}</p></div></div><ul class="info-list">
      <li><span>Register No.</span><b>${esc(me.regNo)}</b></li><li><span>Department</span><b>${esc(me.dept)}</b></li><li><span>Year</span><b>${me.year}</b></li>
      <li><span>Gender</span><b>${esc(me.gender)}</b></li><li><span>Email</span><b>${esc(me.email)}</b></li><li><span>Phone</span><b>${esc(me.phone)}</b></li>
      <li><span>Blood Group</span><b>${esc(me.blood || '-')}</b></li><li><span>Hostel / Room</span><b>${esc(db.settings.hostelName)} / ${esc(roomLabel(me))}</b></li></ul></div>
      <div class="card"><h3>✏️ Update Details</h3><form onsubmit="saveProfile(event)">
      <div class="form-group"><label>Phone</label><input id="pPhone" value="${esc(me.phone)}" required pattern="\\d{10}"></div>
      <div class="form-group"><label>Blood Group</label><input id="pBlood" value="${esc(me.blood)}"></div>
      <div class="form-group"><label>Address</label><textarea id="pAddr">${esc(me.address)}</textarea></div>
      <div class="form-group"><label>Guardian Name</label><input id="pGuard" value="${esc(me.guardian)}"></div>
      <div class="form-group"><label>Guardian Phone (Emergency)</label><input id="pGPhone" value="${esc(me.guardianPhone)}"></div>
      <button class="btn">Save Changes</button></form>
      <hr style="margin:18px 0;border:0;border-top:1px solid #e5e7eb"><h3>🔒 Change Password</h3>
      <div class="form-row"><input id="pwNew" type="password" placeholder="New password (min 6)"><button class="btn secondary" onclick="changeMyPassword()">Update</button></div></div></div>`;
  },

  room(el) {
    reloadMe(); const r = getRoom(me.room);
    if (!r) { el.innerHTML = `<div class="card empty">🛏️ A room has not been allotted to you yet. Please contact the warden.</div>`; return; }
    const mates = roomStudents(r.id);
    el.innerHTML = `<div class="grid-2"><div class="card"><h3>🛏️ Room ${esc(r.id)}</h3><ul class="info-list">
      <li><span>Hostel</span><b>${esc(db.settings.hostelName)}</b></li><li><span>Block</span><b>${esc(buildingName(r.building))}</b></li>
      <li><span>Room Number</span><b>${esc(r.id)}</b></li><li><span>Your Bed</span><b>Bed ${me.bed}</b></li>
      <li><span>Capacity</span><b>${r.capacity} beds</b></li><li><span>Occupied</span><b>${mates.length}</b></li><li><span>Available</span><b>${r.capacity - mates.length}</b></li></ul>
      <p style="margin-top:12px;font-size:.85rem;color:#6b7280">Bed layout:</p>${roomVisual(r)}</div>
      <div class="card"><h3>👥 Roommates</h3><div class="table-wrap"><table><tr><th>Bed</th><th>Name</th><th>Dept</th><th>Phone</th></tr>
      ${mates.sort((a, b) => a.bed - b.bed).map(s => `<tr><td>${s.bed}</td><td>${esc(s.name)} ${s.regNo === me.regNo ? badge('You') : ''}</td><td>${esc(s.dept)}</td><td>${esc(s.phone)}</td></tr>`).join('')}</table></div></div></div>`;
  },

  attendance(el) {
    const m = window._attMonth || today().slice(0, 7); const a = attStats(me.regNo), ma = attStats(me.regNo, m);
    const [y, mo] = m.split('-').map(Number); const first = new Date(y, mo - 1, 1).getDay(), days = new Date(y, mo, 0).getDate();
    let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="h">${d}</div>`).join('') + '<div></div>'.repeat(first);
    for (let d = 1; d <= days; d++) { const k = `${m}-${pad(d)}`, v = (db.attendance[k] || {})[me.regNo]; cells += `<div class="${v || ''}" title="${k}">${d}</div>`; }
    el.innerHTML = `<div class="stat-grid"><div class="stat green"><div class="ic">📈</div><div><b>${a.pct}%</b><span>Overall attendance</span></div></div>
      <div class="stat"><div class="ic">✔️</div><div><b>${a.present}</b><span>Days present</span></div></div>
      <div class="stat red"><div class="ic">✖️</div><div><b>${a.absent}</b><span>Days absent</span></div></div>
      <div class="stat teal"><div class="ic">📅</div><div><b>${ma.pct}%</b><span>This month (${m})</span></div></div></div>
      ${a.pct < 75 ? '<div class="alert error" style="display:block">⚠️ Your attendance is below 75%. Please contact the warden.</div>' : ''}
      <div class="grid-2"><div class="card"><h3>Monthly Calendar <input type="month" value="${m}" style="width:auto" onchange="window._attMonth=this.value;showSection('attendance')"></h3><div class="cal">${cells}</div>
      <p style="margin-top:12px;font-size:.8rem"><span class="badge green">P</span> Present &nbsp; <span class="badge red">A</span> Absent</p></div>
      <div class="card"><h3>Monthly Report</h3><div class="progress"><div style="width:${ma.pct}%"></div></div><p style="margin:8px 0 14px;font-size:.88rem">${ma.present} present / ${ma.absent} absent in ${m}</p>
      <div class="table-wrap" style="max-height:300px;overflow-y:auto"><table><tr><th>Date</th><th>Status</th></tr>
      ${Object.keys(db.attendance).filter(d => d.startsWith(m)).sort().reverse().map(d => `<tr><td>${fmtDate(d)}</td><td>${badge(db.attendance[d][me.regNo] === 'P' ? 'Present' : 'Absent')}</td></tr>`).join('') || '<tr><td colspan="2" class="empty">No records</td></tr>'}</table></div></div></div>`;
  },

  leave(el) {
    const list = db.leaves.filter(l => l.reg === me.regNo).sort((a, b) => b.applied.localeCompare(a.applied));
    el.innerHTML = `<div class="grid-2"><div class="card"><h3>📝 Apply for Leave</h3><form onsubmit="applyLeave(event)">
      <div class="form-group"><label>Leave Type</label><select id="lType" required><option>Home Visit</option><option>Medical</option><option>Emergency</option><option>Academic</option><option>Outing</option><option>Other</option></select></div>
      <div class="form-row"><div class="form-group"><label>Start Date</label><input type="date" id="lFrom" min="${today()}" required></div>
      <div class="form-group"><label>End Date</label><input type="date" id="lTo" min="${today()}" required></div></div>
      <div class="form-group"><label>Reason</label><textarea id="lReason" required placeholder="Explain the reason for leave"></textarea></div><button class="btn">Submit Request</button></form></div>
      <div class="card"><h3>My Leave History</h3><div class="table-wrap"><table><tr><th>ID</th><th>Type</th><th>Dates</th><th>Status</th></tr>
      ${list.map(l => `<tr><td>${l.id}</td><td>${esc(l.type)}<br><small style="color:#6b7280">${esc(l.reason)}</small></td><td>${fmtDate(l.from)}<br>to ${fmtDate(l.to)}</td><td>${badge(l.status)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No leave requests yet</td></tr>'}</table></div></div></div>`;
  },

  complaints(el) {
    const list = db.complaints.filter(c => c.reg === me.regNo).sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = `<div class="grid-2"><div class="card"><h3>🛠️ Submit a Complaint</h3><form onsubmit="submitComplaint(event)">
      <div class="form-group"><label>Category</label><select id="cCat" required><option>Room Maintenance</option><option>Electricity</option><option>Water</option><option>Cleaning</option><option>Food/Mess</option><option>Internet</option><option>Other</option></select></div>
      <div class="form-group"><label>Description</label><textarea id="cDesc" required placeholder="Describe the issue clearly"></textarea></div><button class="btn">Submit Complaint</button></form></div>
      <div class="card"><h3>My Complaints</h3><div class="table-wrap"><table><tr><th>ID</th><th>Category</th><th>Description</th><th>Date</th><th>Status</th></tr>
      ${list.map(c => `<tr><td>${c.id}</td><td>${esc(c.category)}</td><td>${esc(c.desc)}</td><td>${fmtDate(c.date)}</td><td>${badge(c.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No complaints raised</td></tr>'}</table></div></div></div>`;
  },

  mess(el) {
    const m = db.mess.menu[dayName()], fb = db.mess.feedback.filter(f => f.reg === me.regNo);
    window._rating = 0;
    el.innerHTML = `<div class="stat-grid">${[['🌅', 'Breakfast', m.breakfast], ['🍛', 'Lunch', m.lunch], ['☕', 'Evening Snacks', m.snacks], ['🌙', 'Dinner', m.dinner]].map(x => `<div class="stat"><div class="ic">${x[0]}</div><div><span>${x[1]} (Today)</span><b style="font-size:.95rem;font-weight:600">${esc(x[2])}</b></div></div>`).join('')}</div>
      <div class="card"><h3>📅 Weekly Menu</h3>${messMenuTable(dayName())}</div>
      <div class="grid-3"><div class="card"><h3>📣 Mess Announcements</h3>${db.mess.announcements.slice().reverse().map(a => `<div class="notice Mess"><small>${fmtDate(a.date)}</small><p>${esc(a.text)}</p></div>`).join('')}</div>
      <div class="card"><h3>⭐ Mess Feedback</h3><form onsubmit="submitFeedback(event)"><div class="stars" id="stars">${[1, 2, 3, 4, 5].map(i => `<span data-v="${i}" onclick="setRating(${i})">★</span>`).join('')}</div>
      <div class="form-group" style="margin-top:10px"><textarea id="fbText" placeholder="Share your feedback about the food..." required></textarea></div><button class="btn">Send Feedback</button></form>
      ${fb.length ? `<p style="margin-top:12px;font-size:.82rem;color:#6b7280">You have given ${fb.length} feedback(s). Thank you!</p>` : ''}</div>
      <div class="card"><h3>🍲 Mess Complaint</h3><form onsubmit="messComplaint(event)"><div class="form-group"><textarea id="mcText" placeholder="Describe the mess related issue..." required></textarea></div><button class="btn danger">Submit Mess Complaint</button></form></div></div>`;
  },

  fees(el) {
    reloadMe(); const paid = paidAmount(me), pend = pendingAmount(me), pct = Math.round(paid / me.fee.total * 100), st = feeStatus(me);
    el.innerHTML = `<div class="stat-grid"><div class="stat"><div class="ic">💰</div><div><b>${money(me.fee.total)}</b><span>Total hostel fee</span></div></div>
      <div class="stat green"><div class="ic">✅</div><div><b>${money(paid)}</b><span>Paid amount</span></div></div>
      <div class="stat orange"><div class="ic">⏳</div><div><b>${money(pend)}</b><span>Pending amount</span></div></div>
      <div class="stat purple"><div class="ic">📅</div><div><b style="font-size:1.1rem">${fmtDate(db.settings.feeDue)}</b><span>Payment due date</span></div></div></div>
      <div class="card"><h3>Payment Status ${badge(st)}</h3><div class="progress"><div style="width:${pct}%"></div></div><p style="margin:8px 0 14px;font-size:.88rem">${pct}% paid</p>
      ${pend > 0 ? `<button class="btn success" onclick="payNow()">💳 Pay Now (${money(pend)})</button>` : '<span class="badge green">All dues cleared 🎉</span>'}</div>
      <div class="card"><h3>🧾 Payment History</h3><div class="table-wrap"><table><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Mode</th></tr>
      ${me.fee.payments.map(p => `<tr><td>${p.id}</td><td>${fmtDate(p.date)}</td><td>${money(p.amount)}</td><td>${esc(p.mode)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No payments yet</td></tr>'}</table></div></div>`;
  },

  notices(el) { el.innerHTML = `<div class="card"><h3>📢 All Notices & Announcements</h3>${[...db.notices].reverse().map(noticeHTML).join('')}</div>`; },
  contact(el) { el.innerHTML = contactHTML(); }
};

/* Student actions */
function saveProfile(e) {
  e.preventDefault(); const s = getStudent(me.regNo);
  s.phone = val('pPhone'); s.blood = val('pBlood'); s.address = val('pAddr'); s.guardian = val('pGuard'); s.guardianPhone = val('pGPhone');
  saveDB(); toast('Profile updated', 'success'); refresh();
}
function changeMyPassword() {
  const p = $('#pwNew').value; if (p.length < 6) return toast('Password must be at least 6 characters', 'error');
  getStudent(me.regNo).password = p; saveDB(); $('#pwNew').value = ''; toast('Password changed', 'success');
}
function applyLeave(e) {
  e.preventDefault(); const from = val('lFrom'), to = val('lTo');
  if (to < from) return toast('End date cannot be before start date', 'error');
  db.leaves.push({ id: nextId('L', db.leaves, 1000), reg: me.regNo, type: val('lType'), from, to, reason: val('lReason'), status: 'Pending', applied: today() });
  saveDB(); toast('Leave request submitted', 'success'); refresh();
}
function submitComplaint(e) {
  e.preventDefault();
  db.complaints.push({ id: nextId('C', db.complaints, 2000), reg: me.regNo, category: val('cCat'), desc: val('cDesc'), date: today(), status: 'Pending' });
  saveDB(); toast('Complaint submitted', 'success'); refresh();
}
function messComplaint(e) {
  e.preventDefault();
  db.complaints.push({ id: nextId('C', db.complaints, 2000), reg: me.regNo, category: 'Food/Mess', desc: val('mcText'), date: today(), status: 'Pending' });
  saveDB(); toast('Mess complaint submitted', 'success'); showSection('complaints');
}
function setRating(v) { window._rating = v; $$('#stars span').forEach(s => s.classList.toggle('on', +s.dataset.v <= v)); }
function submitFeedback(e) {
  e.preventDefault(); if (!window._rating) return toast('Please select a star rating', 'error');
  db.mess.feedback.push({ reg: me.regNo, name: me.name, rating: window._rating, comment: val('fbText'), date: today() });
  saveDB(); toast('Thanks for your feedback!', 'success'); refresh();
}
function payNow() {
  openModal('Pay Hostel Fee', `<p style="margin-bottom:12px">Pending amount: <b>${money(pendingAmount(me))}</b></p>
    <div class="alert ok" style="display:block">💡 Payment gateway integration (Razorpay / PayU / Stripe) will be added here in the future. For this demo, you can simulate a payment below.</div>
    <div class="form-group"><label>Amount to pay (₹)</label><input type="number" id="payAmt" value="${pendingAmount(me)}" min="1" max="${pendingAmount(me)}"></div>
    <div class="form-group"><label>Mode</label><select id="payMode"><option>UPI</option><option>Card</option><option>Net Banking</option></select></div>
    <button class="btn success block" onclick="simulatePayment()">Simulate Payment</button>`);
}
function simulatePayment() {
  const amt = +val('payAmt'); if (!amt || amt < 1 || amt > pendingAmount(me)) return toast('Enter a valid amount', 'error');
  getStudent(me.regNo).fee.payments.push({ id: 'P' + Date.now().toString().slice(-6), date: today(), amount: amt, mode: val('payMode') });
  saveDB(); closeModal(); toast('Payment recorded successfully', 'success'); refresh();
}

/* ---------- 7. ADMIN DASHBOARD ---------- */
let admin = null;
const adminLinks = [
  ['dashboard', '📊', 'Admin Dashboard'], ['students', '👥', 'Student Management'], ['rooms', '🏢', 'Room Management'], ['attendance', '✅', 'Attendance Management'],
  ['leaves', '📝', 'Leave Management'], ['complaints', '🛠️', 'Complaint Management'], ['fees', '💳', 'Fee Management'], ['notices', '📢', 'Notices'],
  ['mess', '🍽️', 'Mess Management'], ['contact', '📞', 'Contact / Emergency'], ['settings', '⚙️', 'Settings']
];
function initAdmin() {
  admin = guard('admin'); if (!admin) return;
  setupShell('Admin', adminLinks, admin, 'Warden / Admin');
  window.renderers = adminRenderers; startPage('dashboard');
}

const adminRenderers = {
  dashboard(el) {
    const totalBeds = db.rooms.reduce((a, r) => a + r.capacity, 0), occBeds = db.students.filter(s => s.room).length;
    const occRooms = db.rooms.filter(r => roomStudents(r.id).length > 0).length;
    const pendL = db.leaves.filter(l => l.status === 'Pending').length, pendC = db.complaints.filter(c => c.status === 'Pending').length;
    const collected = db.students.reduce((a, s) => a + paidAmount(s), 0), expected = db.students.reduce((a, s) => a + s.fee.total, 0);
    const todayAtt = db.attendance[today()] || {}; const presentToday = Object.values(todayAtt).filter(v => v === 'P').length;
    const last7 = [...Array(7)].map((_, i) => dstr(new Date(Date.now() - (6 - i) * 864e5)));
    const pcts = last7.map(d => { const r = db.attendance[d] || {}, t = Object.keys(r).length; return t ? Math.round(Object.values(r).filter(v => v === 'P').length / t * 100) : 0; });
    const cStat = ['Pending', 'In Progress', 'Resolved'].map(s => db.complaints.filter(c => c.status === s).length);
    const fStat = { Paid: 0, Partial: 0, Pending: 0 }; db.students.forEach(s => fStat[feeStatus(s)]++);
    el.innerHTML = `<div class="stat-grid">
      <div class="stat"><div class="ic">👥</div><div><b>${db.students.length}</b><span>Total students</span></div></div>
      <div class="stat teal"><div class="ic">🏢</div><div><b>${db.rooms.length}</b><span>Total rooms</span></div></div>
      <div class="stat red"><div class="ic">🚪</div><div><b>${occRooms}</b><span>Occupied rooms</span></div></div>
      <div class="stat green"><div class="ic">🛏️</div><div><b>${totalBeds - occBeds}</b><span>Available beds</span></div></div>
      <div class="stat orange"><div class="ic">📝</div><div><b>${pendL}</b><span>Pending leave requests</span></div></div>
      <div class="stat red"><div class="ic">🛠️</div><div><b>${pendC}</b><span>Pending complaints</span></div></div>
      <div class="stat purple"><div class="ic">💰</div><div><b>${money(collected)}</b><span>Fee collected of ${money(expected)}</span></div></div>
      <div class="stat green"><div class="ic">✅</div><div><b>${presentToday}/${db.students.length}</b><span>Today's attendance</span></div></div></div>
    <div class="grid-2" style="margin-bottom:22px"><div class="card"><h3>📈 Attendance - Last 7 Days</h3>${barChart(last7.map(d => d.slice(5)), pcts)}</div>
      <div class="card"><h3>🛏️ Bed Occupancy</h3>${donut([{ label: 'Occupied', value: occBeds, color: '#2f5bea' }, { label: 'Available', value: totalBeds - occBeds, color: '#14b8a6' }], Math.round(occBeds / totalBeds * 100) + '%')}</div></div>
    <div class="grid-2"><div class="card"><h3>💳 Fee Status</h3>${donut([{ label: 'Paid', value: fStat.Paid, color: '#16a34a' }, { label: 'Partial', value: fStat.Partial, color: '#0ea5e9' }, { label: 'Pending', value: fStat.Pending, color: '#f59e0b' }], Math.round(collected / expected * 100) + '%')}</div>
      <div class="card"><h3>🛠️ Complaints by Status</h3>${donut([{ label: 'Pending', value: cStat[0], color: '#f59e0b' }, { label: 'In Progress', value: cStat[1], color: '#0ea5e9' }, { label: 'Resolved', value: cStat[2], color: '#16a34a' }], db.complaints.length)}</div></div>
    <div class="card" style="margin-top:22px"><h3>📢 Recent Notices</h3>${[...db.notices].reverse().slice(0, 3).map(noticeHTML).join('')}</div>`;
  },

  students(el) {
    const rooms = db.rooms.map(r => `<option>${r.id}</option>`).join(''), depts = [...new Set(db.students.map(s => s.dept))].sort().map(d => `<option>${d}</option>`).join('');
    el.innerHTML = `<div class="card"><h3>👥 Students <button class="btn sm" onclick="studentForm()">+ Add Student</button></h3>
      <div class="toolbar"><input id="fSearch" placeholder="🔍 Search name, reg no, room, phone" oninput="renderStudentTable()">
      <select id="fRoom" onchange="renderStudentTable()"><option value="">All Rooms</option><option value="__none">Not allotted</option>${rooms}</select>
      <select id="fYear" onchange="renderStudentTable()"><option value="">All Years</option><option>1</option><option>2</option><option>3</option><option>4</option></select>
      <select id="fDept" onchange="renderStudentTable()"><option value="">All Departments</option>${depts}</select>
      <select id="fAtt" onchange="renderStudentTable()"><option value="">Any Attendance</option><option value="low">Below 75%</option><option value="mid">75% - 90%</option><option value="high">Above 90%</option></select>
      <select id="fFee" onchange="renderStudentTable()"><option value="">Any Fee Status</option><option>Paid</option><option>Partial</option><option>Pending</option></select>
      <select id="fLeave" onchange="renderStudentTable()"><option value="">Any Leave Status</option><option value="Pending">Pending request</option><option value="today">On leave today</option><option value="none">No active leave</option></select>
      <button class="btn secondary sm" onclick="clearFilters()">Clear</button></div><div id="stuTable"></div></div>`;
    renderStudentTable();
  },

  rooms(el) {
    const total = db.rooms.reduce((a, r) => a + r.capacity, 0), occ = db.students.filter(s => s.room).length;
    const un = db.students.filter(s => !s.room).length;
    const f = window._bFilter || '';
    el.innerHTML = `<div class="stat-grid"><div class="stat"><div class="ic">🏢</div><div><b>${db.buildings.length}</b><span>Buildings</span></div></div><div class="stat teal"><div class="ic">🚪</div><div><b>${db.rooms.length}</b><span>Rooms</span></div></div>
      <div class="stat red"><div class="ic">🛏️</div><div><b>${occ}/${total}</b><span>Beds occupied</span></div></div><div class="stat orange"><div class="ic">👤</div><div><b>${un}</b><span>Students without room</span></div></div></div>
      <div class="card"><h3>🏢 Room Management <span><button class="btn sm secondary" onclick="buildingForm()">+ Building</button> <button class="btn sm" onclick="roomForm()">+ Room</button></span></h3>
      <div class="toolbar"><select id="bFilter" onchange="window._bFilter=this.value;showSection('rooms')"><option value="">All Buildings</option>${db.buildings.map(b => `<option value="${b.id}" ${f === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
      <p style="font-size:.82rem;color:#6b7280;margin-bottom:14px">🟢 Vacant &nbsp; 🟠 Partly occupied &nbsp; 🔴 Full &nbsp;• Click a student name to move them to another room.</p>
      <div class="room-grid">${db.rooms.filter(r => !f || r.building === f).map(r => {
        const st = roomStudents(r.id), free = r.capacity - st.length, cls = free === 0 ? 'full' : st.length ? 'partial' : '';
        return `<div class="room-card ${cls}"><h4>Room ${esc(r.id)} ${badge(free === 0 ? 'Occupied' : st.length ? 'Partial' : 'Vacant')}</h4>
        <small style="color:#6b7280">${esc(buildingName(r.building))}</small>${roomVisual(r)}
        <div style="font-size:.84rem">Capacity <b>${r.capacity}</b> • Occupied <b>${st.length}</b> • Available <b>${free}</b></div>
        <div style="margin:8px 0;min-height:28px">${st.map(s => `<span class="chip" onclick="moveStudentForm('${s.regNo}')" title="Change room">${esc(s.name)}</span>`).join('') || '<small style="color:#6b7280">No students</small>'}</div>
        <button class="btn sm" ${free === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''} onclick="assignForm('${r.id}')">+ Assign Student</button>
        <button class="btn sm secondary" onclick="editRoomForm('${r.id}')">Edit</button></div>`;
      }).join('')}</div></div>`;
  },

  attendance(el) {
    const d = window._attDate || today(), m = window._repMonth || today().slice(0, 7);
    const rec = db.attendance[d] || {};
    el.innerHTML = `<div class="card"><h3>✅ Mark Daily Attendance</h3><div class="toolbar"><input type="date" id="attDate" value="${d}" max="${today()}" onchange="window._attDate=this.value;showSection('attendance')">
      <button class="btn secondary sm" onclick="markAll('P')">Mark all Present</button><button class="btn secondary sm" onclick="markAll('A')">Mark all Absent</button><button class="btn success sm" onclick="saveAttendance()">💾 Save Attendance</button></div>
      <div class="table-wrap"><table><tr><th>Reg No</th><th>Name</th><th>Room</th><th>Present</th><th>Absent</th></tr>
      ${db.students.map(s => { const v = rec[s.regNo] || 'P'; return `<tr><td>${esc(s.regNo)}</td><td>${esc(s.name)}</td><td>${esc(s.room || '-')}</td><td><input type="radio" style="width:auto" name="att_${s.regNo}" value="P" ${v === 'P' ? 'checked' : ''}></td><td><input type="radio" style="width:auto" name="att_${s.regNo}" value="A" ${v === 'A' ? 'checked' : ''}></td></tr>`; }).join('')}</table></div></div>
      <div class="card"><h3>📅 Monthly Attendance Report <span><input type="month" id="repMonth" value="${m}" style="width:auto;display:inline-block" onchange="window._repMonth=this.value;showSection('attendance')"> <button class="btn sm secondary" onclick="exportAttendance()">⬇ CSV</button></span></h3>
      <div class="table-wrap"><table><tr><th>Reg No</th><th>Name</th><th>Present</th><th>Absent</th><th>Percentage</th><th></th></tr>
      ${db.students.map(s => { const a = attStats(s.regNo, m); return `<tr><td>${esc(s.regNo)}</td><td>${esc(s.name)}</td><td>${a.present}</td><td>${a.absent}</td><td>${a.pct}%</td><td>${badge(a.pct >= 75 ? 'Present' : 'Absent').replace('Present', 'OK').replace('Absent', 'Low')}</td></tr>`; }).join('')}</table></div></div>`;
  },

  leaves(el) {
    const pend = db.leaves.filter(l => l.status === 'Pending'), hist = db.leaves.filter(l => l.status !== 'Pending').sort((a, b) => b.applied.localeCompare(a.applied));
    const row = (l, act) => { const s = getStudent(l.reg) || { name: '?' }; return `<tr><td>${l.id}</td><td>${esc(s.name)}<br><small>${esc(l.reg)}</small></td><td>${esc(l.type)}</td><td>${fmtDate(l.from)} - ${fmtDate(l.to)}</td><td>${esc(l.reason)}</td><td>${act ? `<button class="btn success sm" onclick="setLeave('${l.id}','Approved')">Approve</button> <button class="btn danger sm" onclick="setLeave('${l.id}','Rejected')">Reject</button>` : badge(l.status)}</td></tr>`; };
    const head = '<tr><th>ID</th><th>Student</th><th>Type</th><th>Dates</th><th>Reason</th><th></th></tr>';
    el.innerHTML = `<div class="card"><h3>⏳ Pending Requests (${pend.length})</h3><div class="table-wrap"><table>${head}${pend.map(l => row(l, true)).join('') || '<tr><td colspan="6" class="empty">No pending requests 🎉</td></tr>'}</table></div></div>
      <div class="card"><h3>📜 Leave History</h3><div class="table-wrap"><table>${head}${hist.map(l => row(l, false)).join('') || '<tr><td colspan="6" class="empty">No history</td></tr>'}</table></div></div>`;
  },

  complaints(el) {
    const f = window._cFilter || '';
    const list = db.complaints.filter(c => !f || c.status === f).sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = `<div class="card"><h3>🛠️ Complaints <select style="width:auto" onchange="window._cFilter=this.value;showSection('complaints')"><option value="">All</option>${['Pending', 'In Progress', 'Resolved'].map(s => `<option ${f === s ? 'selected' : ''}>${s}</option>`).join('')}</select></h3>
      <div class="table-wrap"><table><tr><th>ID</th><th>Student</th><th>Room</th><th>Category</th><th>Description</th><th>Date</th><th>Status</th></tr>
      ${list.map(c => { const s = getStudent(c.reg) || { name: '?', room: '' }; return `<tr><td>${c.id}</td><td>${esc(s.name)}</td><td>${esc(s.room || '-')}</td><td>${esc(c.category)}</td><td>${esc(c.desc)}</td><td>${fmtDate(c.date)}</td>
      <td><select style="width:auto" onchange="setComplaint('${c.id}',this.value)">${['Pending', 'In Progress', 'Resolved'].map(x => `<option ${c.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">No complaints</td></tr>'}</table></div></div>`;
  },

  fees(el) {
    const collected = db.students.reduce((a, s) => a + paidAmount(s), 0), pend = db.students.reduce((a, s) => a + pendingAmount(s), 0);
    const f = window._feeFilter || '';
    el.innerHTML = `<div class="stat-grid"><div class="stat green"><div class="ic">✅</div><div><b>${money(collected)}</b><span>Total collected</span></div></div><div class="stat orange"><div class="ic">⏳</div><div><b>${money(pend)}</b><span>Total pending</span></div></div>
      <div class="stat purple"><div class="ic">📅</div><div><b style="font-size:1.1rem">${fmtDate(db.settings.feeDue)}</b><span>Due date</span></div></div></div>
      <div class="card"><h3>💳 Fee Management <select style="width:auto" onchange="window._feeFilter=this.value;showSection('fees')"><option value="">All</option>${['Paid', 'Partial', 'Pending'].map(s => `<option ${f === s ? 'selected' : ''}>${s}</option>`).join('')}</select></h3>
      <div class="table-wrap"><table><tr><th>Reg No</th><th>Name</th><th>Total</th><th>Paid</th><th>Pending</th><th>Status</th><th></th></tr>
      ${db.students.filter(s => !f || feeStatus(s) === f).map(s => `<tr><td>${esc(s.regNo)}</td><td>${esc(s.name)}</td><td>${money(s.fee.total)}</td><td>${money(paidAmount(s))}</td><td>${money(pendingAmount(s))}</td><td>${badge(feeStatus(s))}</td>
      <td><button class="btn sm" onclick="paymentForm('${s.regNo}')">Record Payment</button> <button class="btn sm secondary" onclick="historyModal('${s.regNo}')">History</button></td></tr>`).join('')}</table></div></div>`;
  },

  notices(el) {
    el.innerHTML = `<div class="grid-2"><div class="card"><h3>📢 Publish Notice</h3><form onsubmit="publishNotice(event)">
      <div class="form-group"><label>Type</label><select id="nType"><option>Notice</option><option>Event</option><option>Maintenance</option><option>Emergency</option><option>Mess</option></select></div>
      <div class="form-group"><label>Title</label><input id="nTitle" required></div><div class="form-group"><label>Message</label><textarea id="nMsg" required></textarea></div><button class="btn">Publish</button></form></div>
      <div class="card"><h3>Published Notices</h3>${[...db.notices].reverse().map(n => `<div class="notice ${esc(n.type)}"><h4>${esc(n.title)} ${badge(n.type)}</h4><small>${fmtDate(n.date)}</small><p>${esc(n.msg)}</p><button class="btn danger sm" style="margin-top:8px" onclick="deleteNotice('${n.id}')">Delete</button></div>`).join('')}</div></div>`;
  },

  mess(el) {
    el.innerHTML = `<div class="card"><h3>🍽️ Weekly Menu <small style="font-weight:400;color:#6b7280">(click a day to edit)</small></h3><div class="toolbar">${Object.keys(db.mess.menu).map(d => `<button class="btn secondary sm" onclick="editMenu('${d}')">${d.slice(0, 3)}</button>`).join('')}</div>${messMenuTable(dayName())}</div>
      <div class="grid-2"><div class="card"><h3>📣 Mess Announcements</h3><form onsubmit="addMessAnn(event)" class="toolbar"><input id="maText" placeholder="Write an announcement" required><button class="btn sm">Post</button></form>
      ${db.mess.announcements.slice().reverse().map(a => `<div class="notice Mess"><small>${fmtDate(a.date)}</small><p>${esc(a.text)}</p></div>`).join('')}</div>
      <div class="card"><h3>⭐ Student Feedback</h3>${db.mess.feedback.slice().reverse().map(f => `<div class="notice"><h4>${esc(f.name)} <span style="color:#f59e0b">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span></h4><small>${fmtDate(f.date)}</small><p>${esc(f.comment)}</p></div>`).join('') || '<div class="empty">No feedback yet</div>'}
      <p style="font-size:.82rem;color:#6b7280">Mess complaints appear in Complaint Management under "Food/Mess".</p></div></div>`;
  },

  contact(el) { el.innerHTML = contactHTML(); },

  settings(el) {
    const s = db.settings, c = s.contacts;
    el.innerHTML = `<div class="grid-2"><div class="card"><h3>⚙️ Hostel Settings</h3><form onsubmit="saveSettings(event)">
      <div class="form-group"><label>Hostel Name</label><input id="sName" value="${esc(s.hostelName)}" required></div>
      <div class="form-group"><label>College Name</label><input id="sCollege" value="${esc(s.collegeName)}" required></div>
      <div class="form-row"><div class="form-group"><label>Annual Hostel Fee (₹)</label><input type="number" id="sFee" value="${s.totalFee}" min="0"></div>
      <div class="form-group"><label>Fee Due Date</label><input type="date" id="sDue" value="${s.feeDue}"></div></div>
      <div class="form-group"><label>Warden Phone</label><input id="sWarden" value="${esc(c.warden.phone)}"></div>
      <div class="form-group"><label>Office Phone</label><input id="sOffice" value="${esc(c.office.phone)}"></div>
      <div class="form-group"><label>Security Phone</label><input id="sSec" value="${esc(c.security.phone)}"></div><button class="btn">Save Settings</button></form></div>
      <div><div class="card"><h3>🔒 Change Admin Password</h3><div class="form-row"><input id="aPw" type="password" placeholder="New password (min 6)"><button class="btn secondary" onclick="changeAdminPassword()">Update</button></div></div>
      <div class="card"><h3>🧪 Demo Data</h3><p style="font-size:.88rem;color:#6b7280;margin-bottom:12px">Restore all students, rooms, attendance, complaints and notices to the original sample data.</p><button class="btn danger" onclick="resetDemoData()">Reset Demo Data</button></div></div></div>`;
  }
};

/* ---- Admin: students ---- */
function clearFilters() { ['fSearch', 'fRoom', 'fYear', 'fDept', 'fAtt', 'fFee', 'fLeave'].forEach(i => $('#' + i).value = ''); renderStudentTable(); }
function renderStudentTable() {
  const q = val('fSearch').toLowerCase(), room = val('fRoom'), yr = val('fYear'), dep = val('fDept'), att = val('fAtt'), fee = val('fFee'), lv = val('fLeave');
  const list = db.students.filter(s => {
    if (q && !(`${s.name} ${s.regNo} ${s.room} ${s.phone}`.toLowerCase().includes(q))) return false;
    if (room === '__none' ? s.room : room && s.room !== room) return false;
    if (yr && String(s.year) !== yr) return false; if (dep && s.dept !== dep) return false;
    const p = attStats(s.regNo).pct;
    if (att === 'low' && p >= 75) return false; if (att === 'mid' && (p < 75 || p > 90)) return false; if (att === 'high' && p <= 90) return false;
    if (fee && feeStatus(s) !== fee) return false;
    if (lv === 'Pending' && !db.leaves.some(l => l.reg === s.regNo && l.status === 'Pending')) return false;
    if (lv === 'today' && !onLeaveToday(s.regNo)) return false;
    if (lv === 'none' && (onLeaveToday(s.regNo) || db.leaves.some(l => l.reg === s.regNo && l.status === 'Pending'))) return false;
    return true;
  });
  $('#stuTable').innerHTML = `<p style="font-size:.82rem;color:#6b7280;margin-bottom:8px">Showing ${list.length} of ${db.students.length} students</p><div class="table-wrap"><table>
    <tr><th>Name</th><th>Reg No</th><th>Dept / Year</th><th>Room</th><th>Phone</th><th>Attendance</th><th>Fee</th><th>Actions</th></tr>
    ${list.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.regNo)}</td><td>${esc(s.dept)} / ${s.year}</td><td>${esc(roomLabel(s))}</td><td>${esc(s.phone)}</td><td>${attStats(s.regNo).pct}%</td><td>${badge(feeStatus(s))}</td>
    <td><button class="btn sm secondary" onclick="viewStudent('${s.regNo}')">View</button> <button class="btn sm secondary" onclick="studentForm('${s.regNo}')">Edit</button> <button class="btn sm danger" onclick="deleteStudent('${s.regNo}')">✕</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">No students match the filters</td></tr>'}</table></div>`;
}
function viewStudent(reg) {
  const s = getStudent(reg), a = attStats(reg);
  openModal('Student Details', `<ul class="info-list"><li><span>Name</span><b>${esc(s.name)}</b></li><li><span>Register No.</span><b>${esc(s.regNo)}</b></li><li><span>Department / Year</span><b>${esc(s.dept)} / ${s.year}</b></li>
    <li><span>Email</span><b>${esc(s.email)}</b></li><li><span>Phone</span><b>${esc(s.phone)}</b></li><li><span>Room</span><b>${esc(roomLabel(s))}</b></li><li><span>Guardian</span><b>${esc(s.guardian || '-')} ${esc(s.guardianPhone || '')}</b></li>
    <li><span>Blood Group</span><b>${esc(s.blood || '-')}</b></li><li><span>Attendance</span><b>${a.pct}%</b></li><li><span>Fee</span><b>${money(paidAmount(s))} / ${money(s.fee.total)} ${badge(feeStatus(s))}</b></li><li><span>Address</span><b>${esc(s.address || '-')}</b></li></ul>`);
}
function studentForm(reg) {
  const s = reg ? getStudent(reg) : { name: '', regNo: '', email: '', phone: '', dept: 'CSE', year: 1, gender: 'Male', guardian: '', guardianPhone: '' };
  const opt = (arr, v) => arr.map(x => `<option ${String(x) === String(v) ? 'selected' : ''}>${x}</option>`).join('');
  openModal(reg ? 'Edit Student' : 'Add Student', `<div class="form-group"><label>Full Name</label><input id="sfName" value="${esc(s.name)}"></div>
    <div class="form-row"><div class="form-group"><label>Register No.</label><input id="sfReg" value="${esc(s.regNo)}" ${reg ? 'disabled' : ''}></div><div class="form-group"><label>Gender</label><select id="sfGender">${opt(['Male', 'Female', 'Other'], s.gender)}</select></div></div>
    <div class="form-row"><div class="form-group"><label>Email</label><input id="sfEmail" value="${esc(s.email)}"></div><div class="form-group"><label>Phone</label><input id="sfPhone" value="${esc(s.phone)}"></div></div>
    <div class="form-row"><div class="form-group"><label>Department</label><select id="sfDept">${opt(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'], s.dept)}</select></div><div class="form-group"><label>Year</label><select id="sfYear">${opt([1, 2, 3, 4], s.year)}</select></div></div>
    <div class="form-row"><div class="form-group"><label>Guardian</label><input id="sfGuard" value="${esc(s.guardian)}"></div><div class="form-group"><label>Guardian Phone</label><input id="sfGPhone" value="${esc(s.guardianPhone)}"></div></div>
    <button class="btn block" onclick="saveStudent('${reg || ''}')">Save</button>`);
}
function saveStudent(reg) {
  const f = { name: val('sfName'), email: val('sfEmail').toLowerCase(), phone: val('sfPhone'), dept: val('sfDept'), year: +val('sfYear'), gender: val('sfGender'), guardian: val('sfGuard'), guardianPhone: val('sfGPhone') };
  if (!f.name || !f.email || !/^\d{10}$/.test(f.phone)) return toast('Name, email and a 10-digit phone are required', 'error');
  if (reg) Object.assign(getStudent(reg), f);
  else {
    const r = val('sfReg').toUpperCase(); if (!r) return toast('Register number required', 'error');
    if (getStudent(r)) return toast('Register number already exists', 'error');
    db.students.push({ ...f, regNo: r, password: 'student123', room: '', bed: 0, blood: '', address: '', fee: { total: db.settings.totalFee, payments: [] } });
  }
  saveDB(); closeModal(); toast('Student saved' + (reg ? '' : ' (default password: student123)'), 'success'); refresh();
}
function deleteStudent(reg) {
  if (!confirm('Remove this student and all related records?')) return;
  db.students = db.students.filter(s => s.regNo !== reg); db.leaves = db.leaves.filter(l => l.reg !== reg); db.complaints = db.complaints.filter(c => c.reg !== reg);
  Object.keys(db.attendance).forEach(d => delete db.attendance[d][reg]); saveDB(); toast('Student removed'); refresh();
}

/* ---- Admin: rooms ---- */
function buildingForm() {
  openModal('Add Hostel Building', `<div class="form-group"><label>Building Code (e.g. C)</label><input id="bId" maxlength="3"></div><div class="form-group"><label>Building Name</label><input id="bName" placeholder="Block C (Boys)"></div><button class="btn block" onclick="saveBuilding()">Add Building</button>`);
}
function saveBuilding() {
  const id = val('bId').toUpperCase(), name = val('bName'); if (!id || !name) return toast('Fill in both fields', 'error');
  if (db.buildings.some(b => b.id === id)) return toast('Building code already exists', 'error');
  db.buildings.push({ id, name }); saveDB(); closeModal(); toast('Building added', 'success'); refresh();
}
function roomForm() {
  openModal('Add Room', `<div class="form-group"><label>Building</label><select id="rmB">${db.buildings.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></div>
    <div class="form-row"><div class="form-group"><label>Room Number</label><input id="rmNo" placeholder="e.g. 201"></div><div class="form-group"><label>Capacity (beds)</label><input type="number" id="rmCap" value="3" min="1" max="10"></div></div><button class="btn block" onclick="saveRoom()">Add Room</button>`);
}
function saveRoom() {
  const b = val('rmB'), no = val('rmNo'), cap = +val('rmCap'); if (!no || cap < 1) return toast('Enter room number and capacity', 'error');
  const id = `${b}-${no}`; if (getRoom(id)) return toast('Room already exists', 'error');
  db.rooms.push({ id, building: b, capacity: cap }); saveDB(); closeModal(); toast('Room added', 'success'); refresh();
}
function editRoomForm(id) {
  const r = getRoom(id);
  openModal('Edit Room ' + id, `<div class="form-group"><label>Capacity</label><input type="number" id="erCap" value="${r.capacity}" min="1" max="10"></div><button class="btn block" onclick="saveRoomCap('${id}')">Save</button> <button class="btn danger block" style="margin-top:8px" onclick="deleteRoom('${id}')">Delete Room</button>`);
}
function saveRoomCap(id) {
  const cap = +val('erCap'), r = getRoom(id); if (cap < roomStudents(id).length) return toast('Capacity cannot be less than current occupants', 'error');
  r.capacity = cap; saveDB(); closeModal(); toast('Room updated', 'success'); refresh();
}
function deleteRoom(id) {
  if (roomStudents(id).length) return toast('Move students out of the room first', 'error');
  db.rooms = db.rooms.filter(r => r.id !== id); saveDB(); closeModal(); toast('Room deleted'); refresh();
}
function assignForm(roomId) {
  const r = getRoom(roomId), list = db.students.filter(s => s.room !== roomId).sort((a, b) => (a.room ? 1 : 0) - (b.room ? 1 : 0));
  openModal('Assign Student to ' + roomId, `<p style="font-size:.85rem;color:#6b7280;margin-bottom:10px">Free beds: ${r.capacity - roomStudents(roomId).length}. Students without a room are listed first.</p>
    <div class="form-group"><select id="asStu">${list.map(s => `<option value="${s.regNo}">${esc(s.name)} (${s.regNo}) - ${s.room ? 'Now in ' + s.room : 'No room'}</option>`).join('')}</select></div><button class="btn block" onclick="doAssign('${roomId}')">Assign</button>`);
}
function doAssign(roomId, reg) { allocate(reg || val('asStu'), roomId); }
function moveStudentForm(reg) {
  const s = getStudent(reg), opts = db.rooms.filter(r => r.id !== s.room && roomStudents(r.id).length < r.capacity);
  openModal('Change Room - ' + esc(s.name), `<p style="margin-bottom:10px;font-size:.88rem">Current: <b>${esc(roomLabel(s))}</b></p><div class="form-group"><label>Move to</label><select id="mvRoom">${opts.map(r => `<option value="${r.id}">${r.id} (${r.capacity - roomStudents(r.id).length} free)</option>`).join('')}</select></div>
    <button class="btn block" onclick="allocate('${reg}',val('mvRoom'))">Move Student</button><button class="btn secondary block" style="margin-top:8px" onclick="allocate('${reg}','')">Remove from room</button>`);
}
function allocate(reg, roomId) {
  const s = getStudent(reg); if (!s) return;
  if (roomId) {
    const r = getRoom(roomId), occ = roomStudents(roomId).filter(x => x.regNo !== reg);
    if (occ.length >= r.capacity) return toast('That room is full', 'error');
    let bed = 1; while (occ.some(x => x.bed === bed)) bed++;
    s.room = roomId; s.bed = bed;
  } else { s.room = ''; s.bed = 0; }
  saveDB(); closeModal(); toast('Room allocation updated', 'success'); refresh();
}

/* ---- Admin: attendance ---- */
function markAll(v) { $$('input[type=radio][value="' + v + '"]').forEach(r => r.checked = true); }
function saveAttendance() {
  const d = val('attDate') || today(); db.attendance[d] = {};
  db.students.forEach(s => { const c = $(`input[name="att_${s.regNo}"]:checked`); db.attendance[d][s.regNo] = c ? c.value : 'P'; });
  saveDB(); toast('Attendance saved for ' + fmtDate(d), 'success');
}
function exportAttendance() {
  const m = val('repMonth'); const rows = [['Reg No', 'Name', 'Present', 'Absent', 'Percentage']];
  db.students.forEach(s => { const a = attStats(s.regNo, m); rows.push([s.regNo, s.name, a.present, a.absent, a.pct + '%']); });
  const blob = new Blob([rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `attendance-${m}.csv`; a.click();
}

/* ---- Admin: leaves / complaints / fees / notices / mess / settings ---- */
function setLeave(id, status) { db.leaves.find(l => l.id === id).status = status; saveDB(); toast('Leave ' + status.toLowerCase(), status === 'Approved' ? 'success' : ''); refresh(); }
function setComplaint(id, status) { db.complaints.find(c => c.id === id).status = status; saveDB(); toast('Complaint marked ' + status, 'success'); }
function paymentForm(reg) {
  const s = getStudent(reg);
  openModal('Record Payment - ' + esc(s.name), `<p style="margin-bottom:10px">Pending: <b>${money(pendingAmount(s))}</b></p><div class="form-group"><label>Amount (₹)</label><input type="number" id="rpAmt" value="${pendingAmount(s)}" min="1"></div>
    <div class="form-group"><label>Mode</label><select id="rpMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Net Banking</option><option>DD / Cheque</option></select></div><button class="btn block" onclick="savePayment('${reg}')">Save Payment</button>`);
}
function savePayment(reg) {
  const amt = +val('rpAmt'), s = getStudent(reg); if (!amt || amt > pendingAmount(s)) return toast('Enter a valid amount (not above pending)', 'error');
  s.fee.payments.push({ id: 'P' + Date.now().toString().slice(-6), date: today(), amount: amt, mode: val('rpMode') }); saveDB(); closeModal(); toast('Payment recorded', 'success'); refresh();
}
function historyModal(reg) {
  const s = getStudent(reg);
  openModal('Payment History - ' + esc(s.name), `<div class="table-wrap"><table><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Mode</th></tr>${s.fee.payments.map(p => `<tr><td>${p.id}</td><td>${fmtDate(p.date)}</td><td>${money(p.amount)}</td><td>${esc(p.mode)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No payments</td></tr>'}</table></div>`);
}
function publishNotice(e) {
  e.preventDefault(); db.notices.push({ id: nextId('N', db.notices, 0), title: val('nTitle'), type: val('nType'), msg: val('nMsg'), date: today() });
  saveDB(); toast('Notice published - students can see it now', 'success'); refresh();
}
function deleteNotice(id) { db.notices = db.notices.filter(n => n.id !== id); saveDB(); toast('Notice deleted'); refresh(); }
function editMenu(day) {
  const m = db.mess.menu[day];
  openModal('Edit Menu - ' + day, ['breakfast', 'lunch', 'snacks', 'dinner'].map(k => `<div class="form-group"><label style="text-transform:capitalize">${k}</label><input id="mn_${k}" value="${esc(m[k])}"></div>`).join('') + `<button class="btn block" onclick="saveMenu('${day}')">Save Menu</button>`);
}
function saveMenu(day) { ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(k => db.mess.menu[day][k] = val('mn_' + k)); saveDB(); closeModal(); toast('Menu updated', 'success'); refresh(); }
function addMessAnn(e) { e.preventDefault(); db.mess.announcements.push({ id: nextId('MA', db.mess.announcements, 0), text: val('maText'), date: today() }); saveDB(); toast('Announcement posted', 'success'); refresh(); }
function saveSettings(e) {
  e.preventDefault(); const s = db.settings;
  s.hostelName = val('sName'); s.collegeName = val('sCollege'); s.totalFee = +val('sFee'); s.feeDue = val('sDue');
  s.contacts.warden.phone = val('sWarden'); s.contacts.office.phone = val('sOffice'); s.contacts.security.phone = val('sSec');
  saveDB(); toast('Settings saved', 'success'); setTimeout(() => location.reload(), 500);
}
function changeAdminPassword() {
  const p = $('#aPw').value; if (p.length < 6) return toast('Password must be at least 6 characters', 'error');
  db.admins.find(a => a.username === admin.username).password = p; saveDB(); $('#aPw').value = ''; toast('Password changed', 'success');
}
