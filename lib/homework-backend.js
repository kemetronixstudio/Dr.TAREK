const fs = require('fs');
const path = require('path');
const FILE_PATH = process.env.HOMEWORK_DATA_PATH || path.join(process.cwd(), 'data', 'homework.json');
function ensureDir(){ fs.mkdirSync(path.dirname(FILE_PATH), { recursive:true }); }
function read(){ try { return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8') || '[]'); } catch (e) { return []; } }
function write(rows){ ensureDir(); fs.writeFileSync(FILE_PATH, JSON.stringify(Array.isArray(rows) ? rows : [], null, 2), 'utf8'); }
function sanitizeQuestion(q){ if (!q || typeof q !== 'object') return null; const text = String(q.text || '').trim(); const answer = String(q.answer || '').trim(); const options = Array.isArray(q.options) ? q.options.map((v) => String(v || '').trim()).filter(Boolean) : []; if (!text || !answer || options.length < 2) return null; return { text, options, answer, skill:String(q.skill || 'Homework').trim(), type:String(q.type || 'Question').trim(), image:q.image || null }; }
function sanitize(row){ const classes = Array.isArray(row.classes) ? row.classes.map((v) => String(v || '').trim()).filter(Boolean) : []; const questions = Array.isArray(row.questions) ? row.questions.map(sanitizeQuestion).filter(Boolean) : []; return { id:String(row.id || ('HW-' + Date.now())).trim(), title:String(row.title || '').trim().slice(0, 160), grade:String(row.grade || '').trim().toUpperCase(), classes, date:String(row.date || '').trim(), mode:String(row.mode || 'select').trim(), questions, useTimer:!!row.useTimer, timerMinutes:Math.max(0, Number(row.timerMinutes || 0) || 0), usePassword:!!row.usePassword, password:String(row.password || '').trim().slice(0, 60), tryLimit:Math.max(0, Math.min(5, Number(row.tryLimit || 0) || 0)), createdAt:String(row.createdAt || new Date().toISOString()) };
}
async function list(){ return { ok:true, rows: read() }; }
async function save(row){ const data = sanitize(row || {}); if (!data.title) throw new Error('Homework title is required'); if (!data.grade) throw new Error('Homework grade is required'); if (!data.date) throw new Error('Homework date is required'); if (!data.questions.length) throw new Error('At least one homework question is required'); const rows = read().filter((item) => item.id !== data.id); rows.unshift(data); write(rows); return { ok:true, row:data }; }
async function remove(id){ const key = String(id || '').trim(); if (!key) throw new Error('Homework id is required'); const rows = read().filter((item) => item.id !== key); write(rows); return { ok:true }; }
module.exports = { list, save, remove };
