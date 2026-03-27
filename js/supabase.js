// supabase.js - Supabase 클라이언트 초기화
// anon key는 RLS로 보호되는 공개 키입니다

const SUPABASE_URL = 'https://qqcbccwefemyqxixicwl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxY2JjY3dlZmVteXF4aXhpY3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDcwMTEsImV4cCI6MjA5MDE4MzAxMX0.rlZnEQlVGWdD4NBRzMUq8dpVMXnDwP2XHf0lfWvvBv4';

const { createClient } = supabase;

// persistSession: false → 브라우저 닫으면 세션 삭제 (sessionStorage 방식)
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: sessionStorage
  }
});
