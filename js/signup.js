// signup.js - gallery.junphoto.co.kr 계정으로 바로 회원가입하는 모달
// anon key는 RLS로 보호되는 공개 키입니다 (gallery 사이트 js/supabase.js와 동일)

const SUPABASE_URL = 'https://jjwhawwbenfqueijojts.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mv2FQIfrRGXl9c6SlcHcMg_jwoS0l9X';

document.addEventListener('DOMContentLoaded', () => {
  const openBtn   = document.getElementById('signupBtn');
  const overlay   = document.getElementById('signupModalOverlay');
  const closeBtn  = document.getElementById('signupModalClose');
  const submitBtn = document.getElementById('signupSubmit');
  const emailEl   = document.getElementById('signupEmail');
  const passwordEl = document.getElementById('signupPassword');
  const messageEl = document.getElementById('signupMessage');

  if (!openBtn || !overlay) return;

  const { createClient } = supabase;
  const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function openModal() {
    overlay.classList.add('is-open');
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    emailEl.value = '';
    passwordEl.value = '';
    messageEl.textContent = '';
    messageEl.classList.remove('is-success');
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  submitBtn.addEventListener('click', async () => {
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    messageEl.textContent = '';
    messageEl.classList.remove('is-success');

    if (!email || !password) {
      messageEl.textContent = '이메일과 비밀번호를 입력해주세요.';
      return;
    }
    if (password.length < 6) {
      messageEl.textContent = '비밀번호는 6자 이상이어야 합니다.';
      return;
    }

    submitBtn.disabled = true;
    const { data, error } = await _supabase.auth.signUp({ email, password });
    submitBtn.disabled = false;

    if (error) {
      messageEl.textContent = '회원가입에 실패했습니다. 다시 시도해주세요.';
    } else if (data.session) {
      messageEl.classList.add('is-success');
      messageEl.textContent = '가입이 완료되었습니다!';
    } else {
      messageEl.classList.add('is-success');
      messageEl.textContent = '이메일을 확인하여 가입을 완료해주세요.';
    }
  });
});
